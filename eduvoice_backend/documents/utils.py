"""
Utility functions for document processing.
"""
import os
import logging
import PyPDF2
from docx import Document as DocxDocument
from django.conf import settings

logger = logging.getLogger(__name__)

# Check if Gemini is available for enhanced text extraction
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

GEMINI_CONFIGURED = bool(getattr(settings, 'GEMINI_API_KEY', ''))


def extract_text_from_pdf(file_path):
    """
    Extract text from PDF file.
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        Extracted text as string
    """
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = []
            
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text.append(page_text)
            
            extracted_text = '\n\n'.join(text)
            logger.info(f'Extracted {len(extracted_text)} characters from PDF')
            return extracted_text
            
    except Exception as e:
        logger.error(f'Error extracting text from PDF: {str(e)}', exc_info=True)
        raise Exception(f"Error extracting text from PDF: {str(e)}")


def extract_text_from_pdf_with_gemini(file_path):
    """
    Extract text from PDF using Gemini API for better accuracy.
    Falls back to PyPDF2 if Gemini is unavailable.
    
    Args:
        file_path: Path to PDF file
        
    Returns:
        Extracted text as string
    """
    if not GEMINI_AVAILABLE or not GEMINI_CONFIGURED:
        logger.warning('Gemini not available. Using PyPDF2 for extraction.')
        return extract_text_from_pdf(file_path)
    
    try:
        # Configure Gemini
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Upload PDF to Gemini
        logger.info(f'Uploading PDF to Gemini API: {file_path}')
        uploaded_file = genai.upload_file(file_path)
        
        # Use Gemini 1.5 Flash to extract text
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = """Extract all text from this PDF document. 
        Preserve the structure and formatting as much as possible.
        Return only the extracted text with no additional comments or explanations."""
        
        response = model.generate_content([uploaded_file, prompt])
        
        if response and response.text:
            extracted_text = response.text.strip()
            logger.info(f'Gemini extracted {len(extracted_text)} characters from PDF')
            return extracted_text
        else:
            logger.warning('Gemini returned empty response. Falling back to PyPDF2.')
            return extract_text_from_pdf(file_path)
            
    except Exception as e:
        logger.error(f'Gemini PDF extraction failed: {str(e)}. Falling back to PyPDF2.', exc_info=True)
        return extract_text_from_pdf(file_path)


def extract_text_from_docx(file_path):
    """
    Extract text from DOCX file.
    
    Args:
        file_path: Path to DOCX file
        
    Returns:
        Extracted text as string
    """
    try:
        doc = DocxDocument(file_path)
        text = []
        
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text.append(paragraph.text)
        
        extracted_text = '\n\n'.join(text)
        logger.info(f'Extracted {len(extracted_text)} characters from DOCX')
        return extracted_text
        
    except Exception as e:
        logger.error(f'Error extracting text from DOCX: {str(e)}', exc_info=True)
        raise Exception(f"Error extracting text from DOCX: {str(e)}")


def extract_text_from_txt(file_path):
    """
    Extract text from TXT file.
    
    Args:
        file_path: Path to TXT file
        
    Returns:
        Text content as string
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
            logger.info(f'Extracted {len(content)} characters from TXT')
            return content
            
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as file:
                content = file.read()
                logger.info(f'Extracted {len(content)} characters from TXT (latin-1)')
                return content
        except Exception as e:
            logger.error(f'Error reading TXT file: {str(e)}', exc_info=True)
            raise Exception(f"Error reading TXT file: {str(e)}")
            
    except Exception as e:
        logger.error(f'Error extracting text from TXT: {str(e)}', exc_info=True)
        raise Exception(f"Error extracting text from TXT: {str(e)}")


def extract_text_from_document(document, use_gemini=False):
    """
    Extract text from document based on file type.
    
    Args:
        document: Document model instance
        use_gemini: Whether to use Gemini for PDF extraction (default: False)
        
    Returns:
        Extracted text as string
    """
    file_path = document.file.path
    file_type = document.file_type.lower()
    
    logger.info(f'Extracting text from {file_type} document: {document.title}')
    
    if file_type == 'pdf':
        if use_gemini:
            return extract_text_from_pdf_with_gemini(file_path)
        else:
            return extract_text_from_pdf(file_path)
    elif file_type == 'docx':
        return extract_text_from_docx(file_path)
    elif file_type == 'txt':
        return extract_text_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def validate_document_file(file):
    """
    Validate document file.
    
    Args:
        file: UploadedFile object
        
    Returns:
        dict with validation result
    """
    errors = []
    
    # Check file size
    max_size = getattr(settings, 'FILE_UPLOAD_MAX_MEMORY_SIZE', 10 * 1024 * 1024)  # Default 10MB
    if file.size > max_size:
        errors.append(f"File size exceeds maximum allowed size of {max_size / 1024 / 1024}MB")
    
    # Check file extension
    ext = os.path.splitext(file.name)[1].lower()
    supported_types = getattr(settings, 'SUPPORTED_DOCUMENT_TYPES', ['.pdf', '.docx', '.txt'])
    
    if ext not in supported_types:
        errors.append(f"File type '{ext}' is not supported. Allowed types: {', '.join(supported_types)}")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }


def clean_extracted_text(text):
    """
    Clean and normalize extracted text.
    
    Args:
        text: Raw extracted text
        
    Returns:
        Cleaned text
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    lines = [line.strip() for line in text.split('\n')]
    lines = [line for line in lines if line]  # Remove empty lines
    
    # Join with proper spacing
    cleaned = '\n\n'.join(lines)
    
    return cleaned