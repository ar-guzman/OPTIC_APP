# Generated by Django 2.0.3 on 2018-06-22 17:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0014_aro_orden_fecha'),
    ]

    operations = [
        migrations.AddField(
            model_name='abono_aro',
            name='fecha',
            field=models.DateField(auto_now=True),
        ),
    ]
