# Generated by Django 2.0.3 on 2018-05-19 17:03

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0012_inventario'),
    ]

    operations = [
        migrations.AddField(
            model_name='inventario',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False),
        ),
    ]
