# Generated by Django 2.0.3 on 2018-03-25 04:59

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0001_initial'),
    ]

    operations = [
        migrations.RenameField(
            model_name='proveedor',
            old_name='provContact1',
            new_name='contact_1',
        ),
        migrations.RenameField(
            model_name='proveedor',
            old_name='provContact2',
            new_name='contact_2',
        ),
        migrations.RenameField(
            model_name='proveedor',
            old_name='provDirection',
            new_name='direction',
        ),
        migrations.RenameField(
            model_name='proveedor',
            old_name='provName',
            new_name='name',
        ),
        migrations.RenameField(
            model_name='proveedor',
            old_name='provUuid',
            new_name='uuid',
        ),
    ]
