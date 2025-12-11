"""
Signals for automatic document processing.
"""
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Document

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Document)
def auto_convert_document_to_audio(sender, instance, created, **kwargs):
    """
    Automatically trigger audio conversion when a document is marked as ready.
    This signal fires after text extraction is complete.
    """
    # Only proceed if document status is READY and has extracted text
    if instance.status == Document.Status.READY and instance.extracted_text:
        # Check if audio already exists for this document
        existing_audio = instance.audio_files.filter(status='completed').exists()
        
        if not existing_audio:
            logger.info(f"Auto-converting document {instance.id} to audio")
            
            # Import here to avoid circular imports
            from audio.tasks import convert_document_to_audio
            
            # Get user preferences
            user = instance.uploaded_by
            voice_type = getattr(user, 'preferred_voice_type', 'female')
            speech_rate = getattr(user, 'preferred_speech_rate', 1.0)
            language = getattr(user, 'preferred_language', 'en')
            
            try:
                # Trigger async conversion task
                task = convert_document_to_audio.delay(
                    document_id=instance.id,
                    user_id=user.id,
                    voice_type=voice_type,
                    speech_rate=speech_rate,
                    language=language,
                    use_elevenlabs=False  # Default to Google TTS
                )
                logger.info(f"Conversion task {task.id} created for document {instance.id}")
            except Exception as e:
                logger.error(f"Failed to trigger audio conversion for document {instance.id}: {str(e)}")
        else:
            logger.debug(f"Document {instance.id} already has audio, skipping conversion")
