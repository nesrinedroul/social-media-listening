from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Creates default users for testing'

    def handle(self, *args, **kwargs):
        from apps.accounts.models import User

        users = [
            {
                'email':        'admin@admin.com',
                'password':     'Admin1234!',
                'role':         'admin',
                'is_staff':     True,
                'is_superuser': True,
                'is_active':    True,
                'first_name':   'Admin',
                'last_name':    'User',
            },
            {
                'email':      'supervisor@test.com',
                'password':   'Super1234!',
                'role':       'supervisor',
                'is_active':  True,
                'first_name': 'Sara',
                'last_name':  'Supervisor',
            },
            {
                'email':          'agent@test.com',
                'password':       'Agent1234!',
                'role':           'agent',
                'is_active':      True,
                'first_name':     'Adam',
                'last_name':      'Agent',
                'status':         'offline',
                'manual_status':  'offline',
            },
        ]

        for data in users:
            email    = data.pop('email')
            password = data.pop('password')

            if not User.objects.filter(email=email).exists():
                user = User(email=email, **data)
                user.set_password(password)
                user.save()
                self.stdout.write(f'Created: {email}')
            else:
                self.stdout.write(f'Already exists: {email}')