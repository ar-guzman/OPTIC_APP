# Generated by Django 2.0.3 on 2018-07-15 09:08

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('ordenes', '0030_auto_20180712_1809'),
    ]

    operations = [
        migrations.AddField(
            model_name='abono_aro',
            name='active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='abono_completa',
            name='active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='aro_orden',
            name='usuario',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='completa_orden',
            name='usuario',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, to=settings.AUTH_USER_MODEL),
            preserve_default=False,
        ),
    ]