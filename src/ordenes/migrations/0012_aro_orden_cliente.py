# Generated by Django 2.0.3 on 2018-06-22 06:23

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0011_auto_20180622_0019'),
    ]

    operations = [
        migrations.AddField(
            model_name='aro_orden',
            name='cliente',
            field=models.ForeignKey(default=1, on_delete=django.db.models.deletion.PROTECT, to='ordenes.Cliente'),
            preserve_default=False,
        ),
    ]