"""
Celery tasks for audio conversion.
"""
import os
import tempfile
from celery import shared_task
from django.conf import settings
from django.core.files import File
from django.core.mail import send_mail
from gtts import gTTS
from pydub import AudioSegment
from mutagen.mp3 import MP3
from documents.models import Document
from audio.models import AudioFile
from users.models import AudioPreference

# Check if ElevenLabs is available
try:
    from elevenlabs import generate, set_api_key, voices
    ELEVENLABS_AVAILABLE = True
except ImportError:
    ELEVENLABS_AVAILABLE = False

# Check if Gemini is available
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

# Gemini availability flag
GEMINI_CONFIGURED = bool(getattr(settings, 'GEMINI_API_KEY', ''))


@shared_task(bind=True, max_retries=3)
def convert_document_to_audio(self, document_id, user_id, voice_type='female', speech_rate=1.0, language='en', use_elevenlabs=False, use_gemini=False):
    """
    Convert document text to audio using gTTS, ElevenLabs, or Gemini.
    
    Args:
        document_id: Document ID to convert
        user_id: User ID requesting conversion
        voice_type: Voice type (male/female)
        speech_rate: Speech rate (0.5 to 2.0)
        language: Language code
        use_elevenlabs: Use ElevenLabs instead of Google TTS
        use_gemini: Use Gemini (prioritized if available)
    """
    try:
        # Get document
        document = Document.objects.get(id=document_id)
        
        # Create audio file record
        audio_file = AudioFile.objects.create(
            document=document,
            voice_type=voice_type,
            speech_rate=speech_rate,
            language=language,
            status=AudioFile.Status.PROCESSING,
            task_id=self.request.id
        )
        
        # Extract text
        text = document.extracted_text
        
        if not text or len(text.strip()) == 0:
            raise ValueError("No text content found in document")
        
        # Choose TTS engine (Gemini > ElevenLabs > gTTS)
        if use_gemini and GEMINI_AVAILABLE and GEMINI_CONFIGURED:
            temp_path = generate_audio_gemini(text, voice_type, speech_rate, language)
        elif use_elevenlabs and ELEVENLABS_AVAILABLE and getattr(settings, 'ELEVENLABS_API_KEY', ''):
            temp_path = generate_audio_elevenlabs(text, voice_type, language)
        else:
            temp_path = generate_audio_gtts(text, voice_type, speech_rate, language)
        
        # Get audio duration
        audio_info = MP3(temp_path)
        duration = audio_info.info.length
        
        # Save audio file to model
        with open(temp_path, 'rb') as f:
            audio_file.audio_file.save(
                f"{document.title[:50]}.mp3",
                File(f),
                save=True
            )
        
        audio_file.duration = duration
        audio_file.status = AudioFile.Status.COMPLETED
        audio_file.save()
        
        # Clean up temp file
        os.remove(temp_path)
        
        # Send email notification
        send_conversion_complete_email.delay(user_id, document.title, audio_file.id)
        
        return {'status': 'success', 'audio_id': audio_file.id}
        
    except Exception as e:
        audio_file.status = AudioFile.Status.FAILED
        audio_file.error_message = str(e)
        audio_file.save()
        raise self.retry(exc=e, countdown=60 * (2 ** self.request.retries))


def generate_audio_gtts(text, voice_type, speech_rate, language):
    """Generate audio using Google TTS."""
    # Note: gTTS has limited voice options
    tts = gTTS(text=text, lang=language, slow=(speech_rate < 1.0))
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
        temp_path = temp_file.name
        tts.save(temp_path)
    
    # Adjust speed if needed (using pydub)
    if speech_rate != 1.0:
        audio = AudioSegment.from_mp3(temp_path)
        
        # Change speed
        if speech_rate > 1.0:
            audio = audio.speedup(playback_speed=speech_rate)
        else:
            # For slower speed
            audio = audio._spawn(audio.raw_data, overrides={
                "frame_rate": int(audio.frame_rate * speech_rate)
            })
            audio = audio.set_frame_rate(44100)
        
        # Export adjusted audio
        adjusted_path = temp_path.replace('.mp3', '_adjusted.mp3')
        audio.export(adjusted_path, format='mp3')
        os.remove(temp_path)
        temp_path = adjusted_path
    
    return temp_path


def generate_audio_elevenlabs(text, voice_type, language='en'):
    """Generate audio using ElevenLabs TTS."""
    # Set API key
    set_api_key(settings.ELEVENLABS_API_KEY)
    
    # Map voice_type to ElevenLabs voice IDs
    # You can get voice IDs from: https://api.elevenlabs.io/v1/voices
    voice_map = {
        'male': 'pNInz6obpgDQGcFmaJgB',  # Adam
        'female': 'EXAVITQu4vr4xnSDxMaL',  # Bella
    }
    
    voice_id = voice_map.get(voice_type, voice_map['female'])
    
    # Generate audio
    # Split text into chunks if too long (ElevenLabs has character limits)
    max_chars = 5000
    audio_segments = []
    
    for i in range(0, len(text), max_chars):
        chunk = text[i:i + max_chars]
        audio_data = generate(
            text=chunk,
            voice=voice_id,
            model="eleven_monolingual_v1"
        )
        audio_segments.append(audio_data)
    
    # Save to temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
        temp_path = temp_file.name
        for segment in audio_segments:
            temp_file.write(segment)
    
    return temp_path


def generate_audio_gemini(text, voice_type, speech_rate, language='en'):
    """Generate audio using Google Gemini.
    
    Uses Gemini to enhance/summarize text, then converts to audio via gTTS.
    This provides better quality output by processing the text through an LLM first.
    """
    import logging
    logger = logging.getLogger(__name__)
    
    if not GEMINI_AVAILABLE or not GEMINI_CONFIGURED:
        logger.warning('Gemini not configured. Falling back to gTTS.')
        return generate_audio_gtts(text, voice_type, speech_rate, language)
    
    try:
        # Configure Gemini API
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Use Gemini to enhance/improve the text for better TTS output
        # Request Gemini to clean up the text and make it more suitable for speech
        model = genai.GenerativeModel('gemini-pro')
        
        # Create a prompt to enhance text for TTS
        prompt = f"""You are an expert in preparing text for text-to-speech conversion.
Please reformat the following text to sound natural when read aloud. Follow these rules:
1. Break long sentences into shorter ones (max 20 words per sentence)
2. Replace abbreviations with full words (e.g., Dr. becomes Doctor, etc. becomes and so on)
3. Add natural pauses using periods and commas appropriately
4. Keep the original meaning and all important information
5. Make it conversational and easy to understand
6. Return ONLY the reformatted text with no explanations

Text to reformat:
{text[:3000]}

Reformatted text:"""
        
        # Call Gemini to enhance text
        logger.info('Calling Gemini API to enhance text for TTS...')
        response = model.generate_content(prompt, safety_settings=[
            {
                "category": "HARM_CATEGORY_UNSPECIFIED",
                "threshold": "BLOCK_NONE"
            },
        ])
        
        if not response or not response.text:
            logger.warning('Gemini returned empty response. Using original text.')
            enhanced_text = text
        else:
            enhanced_text = response.text.strip()
            logger.info(f'Gemini enhanced text for TTS (original: {len(text)} chars, enhanced: {len(enhanced_text)} chars)')
        
        # Now use gTTS with the enhanced text
        # This combines Gemini's text processing with gTTS's audio generation
        logger.info('Generating audio with gTTS...')
        tts = gTTS(text=enhanced_text, lang=language, slow=(speech_rate < 1.0))
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp3') as temp_file:
            temp_path = temp_file.name
            tts.save(temp_path)
        
        # Adjust speed if needed
        if speech_rate != 1.0:
            audio = AudioSegment.from_mp3(temp_path)
            
            if speech_rate > 1.0:
                audio = audio.speedup(playback_speed=speech_rate)
            else:
                audio = audio._spawn(audio.raw_data, overrides={
                    "frame_rate": int(audio.frame_rate * speech_rate)
                })
                audio = audio.set_frame_rate(44100)
            
            adjusted_path = temp_path.replace('.mp3', '_adjusted.mp3')
            audio.export(adjusted_path, format='mp3')
            os.remove(temp_path)
            temp_path = adjusted_path
        
        logger.info(f'Gemini-enhanced audio generated successfully at {temp_path}')
        return temp_path
        
    except Exception as e:
        logger.error(f'Gemini TTS conversion failed: {str(e)}. Falling back to gTTS.', exc_info=True)
        # Fallback to gTTS if Gemini fails
        return generate_audio_gtts(text, voice_type, speech_rate, language)


@shared_task
def send_conversion_complete_email(user_id, document_title, audio_id):
    """Send email notification when conversion is complete."""
    try:
        from users.models import CustomUser
        user = CustomUser.objects.get(id=user_id)
        
        if user.email:
            send_mail(
                subject='Audio Conversion Complete',
                message=f'Your document "{document_title}" has been converted to audio successfully!',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,
            )
    except Exception as e:
        # Log error but don't fail the task
        print(f"Failed to send email: {e}")
        # Clean up temp file
        os.remove(temp_path)
        
        # Send email notification
        send_conversion_complete_email.delay(user_id, document.title, audio_file.id)
        
        return {
            'status': 'success',
            'audio_file_id': audio_file.id,
            'duration': duration
        }
        
    except Document.DoesNotExist:
        return {'status': 'error', 'message': 'Document not found'}
    
    except Exception as e:
        # Update audio file status
        if 'audio_file' in locals():
            audio_file.status = AudioFile.Status.FAILED
            audio_file.error_message = str(e)
            audio_file.save()
        
        # Retry task
        raise self.retry(exc=e, countdown=60)


@shared_task
def send_conversion_complete_email(user_id, document_title, audio_file_id):
    """
    Send email notification when audio conversion is complete.
    
    Args:
        user_id: User ID to notify
        document_title: Title of converted document
        audio_file_id: ID of generated audio file
    """
    try:
        from users.models import CustomUser
        
        user = CustomUser.objects.get(id=user_id)
        
        # Check if user wants email notifications
        try:
            prefs = AudioPreference.objects.get(user=user)
            if not prefs.email_notifications:
                return
        except AudioPreference.DoesNotExist:
            pass
        
        subject = f"Audio conversion complete: {document_title}"
        message = f"""
Hello {user.first_name or user.username},

Your document "{document_title}" has been successfully converted to audio.

You can now listen to or download the audio file from your EduVoice dashboard.

Best regards,
EduVoice Team
        """
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [user.email],
            fail_silently=True
        )
        
    except Exception as e:
        # Log error but don't fail
        print(f"Error sending email: {str(e)}")


@shared_task
def cleanup_old_audio_files():
    """
    Delete audio files older than configured days.
    Run this task periodically (e.g., daily) using Celery Beat.
    """
    from datetime import timedelta
    from django.utils import timezone
    
    try:
        cutoff_date = timezone.now() - timedelta(days=settings.AUDIO_CLEANUP_DAYS)
        
        old_audio_files = AudioFile.objects.filter(
            generated_date__lt=cutoff_date,
            status=AudioFile.Status.COMPLETED
        )
        
        deleted_count = 0
        for audio_file in old_audio_files:
            audio_file.delete()
            deleted_count += 1
        
        return {
            'status': 'success',
            'deleted_count': deleted_count
        }
        
    except Exception as e:
        return {
            'status': 'error',
            'message': str(e)
        }
