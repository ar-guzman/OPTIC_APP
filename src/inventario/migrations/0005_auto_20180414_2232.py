# Generated by Django 2.0.3 on 2018-04-15 04:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0004_auto_20180412_1543'),
    ]

    operations = [
        migrations.AlterField(
            model_name='proveedor',
            name='contact_2',
            field=models.PositiveIntegerField(db_column='contact_number_2', null=True),
        ),
    ]