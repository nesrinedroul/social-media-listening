from django.db import migrations


def create_default_groups(apps, schema_editor):
    AgentGroup = apps.get_model('accounts', 'AgentGroup')
    platforms  = ['facebook', 'instagram', 'whatsapp', 'email', 'all']
    names      = {
        'facebook':  'Groupe Facebook',
        'instagram': 'Groupe Instagram',
        'whatsapp':  'Groupe WhatsApp',
        'email':     'Groupe Email',
        'all':       'Groupe Général',
    }
    for platform in platforms:
        AgentGroup.objects.get_or_create(
            platform=platform,
            defaults={'name': names[platform], 'is_active': True}
        )


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0002_agentgroup'),  # adjust number if needed
    ]
    operations = [
        migrations.RunPython(create_default_groups),
    ]