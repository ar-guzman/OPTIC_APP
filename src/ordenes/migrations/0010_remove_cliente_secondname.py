# Generated by Django 2.0.3 on 2018-06-19 02:00

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0009_auto_20180618_2000'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cliente',
            name='secondname',
        ),
    ]
