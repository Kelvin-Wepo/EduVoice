"""
Utility functions for document processing.
"""
import os
import PyPDF2
from docx import Document as DocxDocument
from django.conf import settings


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
            
            return '\n\n'.join(text)
    except Exception as e:
        raise Exception(f"Error extracting text from PDF: {str(e)}")


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
        
        return '\n\n'.join(text)
    except Exception as e:
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
            return file.read()
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read()
        except Exception as e:
            raise Exception(f"Error reading TXT file: {str(e)}")
    except Exception as e:
        raise Exception(f"Error extracting text from TXT: {str(e)}")


def extract_text_from_document(document):
    """
    Extract text from document based on file type.
    
    Args:
        document: Document model instance
        
    Returns:
        Extracted text as string
    """
    file_path = document.file.path
    file_type = document.file_type.lower()
    
    if file_type == 'pdf':
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
    if file.size > settings.FILE_UPLOAD_MAX_MEMORY_SIZE:
        errors.append(f"File size exceeds maximum allowed size of {settings.FILE_UPLOAD_MAX_MEMORY_SIZE / 1024 / 1024}MB")
    
    # Check file extension
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in settings.SUPPORTED_DOCUMENT_TYPES:
        errors.append(f"File type '{ext}' is not supported. Allowed types: {', '.join(settings.SUPPORTED_DOCUMENT_TYPES)}")
    
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }
