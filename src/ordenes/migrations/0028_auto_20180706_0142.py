# Generated by Django 2.0.3 on 2018-07-06 07:42

from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0027_auto_20180705_1251'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='clientrefraction',
            name='cliente',
        ),
        migrations.RemoveField(
            model_name='clientrefraction',
            name='refraction',
        ),
        migrations.AlterModelOptions(
            name='completa_orden',
            options={'ordering': ['-fecha']},
        ),
        migrations.AddField(
            model_name='refraction',
            name='cliente',
            field=models.ForeignKey(default=13, on_delete=django.db.models.deletion.PROTECT, related_name='cliente', to='ordenes.Cliente'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='refraction',
            name='fecha',
            field=models.DateField(auto_now_add=True, default=django.utils.timezone.now),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='refraction',
            name='propia',
            field=models.BooleanField(default=True),
        ),
        migrations.DeleteModel(
            name='ClientRefraction',
        ),
    ]