# Generated by Django 2.0.3 on 2018-07-02 16:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0025_auto_20180702_1024'),
    ]

    operations = [
        migrations.AddField(
            model_name='completa_orden',
            name='ventalente',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=9),
        ),
        migrations.AlterField(
            model_name='aro_orden',
            name='total',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=9),
        ),
        migrations.AlterField(
            model_name='completa_orden',
            name='total',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=9),
        ),
    ]