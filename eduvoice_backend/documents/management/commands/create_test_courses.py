"""
Management command to create test courses.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from documents.models import Course

User = get_user_model()


class Command(BaseCommand):
    help = 'Create test courses for development'

    def handle(self, *args, **options):
        # Get or create a teacher user
        teacher, created = User.objects.get_or_create(
            username='teacher',
            defaults={
                'email': 'teacher@example.com',
                'role': 'teacher',
                'first_name': 'Test',
                'last_name': 'Teacher',
            }
        )
        
        if created:
            teacher.set_password('teacher123')
            teacher.save()
            self.stdout.write(self.style.SUCCESS(f'Created teacher user: teacher / teacher123'))

        # Create sample courses
        courses_data = [
            {
                'code': 'MATH101',
                'name': 'Introduction to Calculus',
                'description': 'Basic calculus concepts and applications',
            },
            {
                'code': 'PHYS201',
                'name': 'Physics II',
                'description': 'Electricity and Magnetism',
            },
            {
                'code': 'CS301',
                'name': 'Data Structures',
                'description': 'Advanced data structures and algorithms',
            },
            {
                'code': 'HIST150',
                'name': 'World History',
                'description': 'Survey of world history from ancient to modern times',
            },
        ]

        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                code=course_data['code'],
                created_by=teacher,
                defaults=course_data
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'Created course: {course.code} - {course.name}')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'Course already exists: {course.code}')
                )

        self.stdout.write(self.style.SUCCESS('\nTest courses created successfully!'))
