# Generated by Django 2.0.3 on 2018-06-26 04:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0019_auto_20180625_2155'),
    ]

    operations = [
        migrations.AlterField(
            model_name='refractionacs',
            name='eje',
            field=models.IntegerField(),
        ),
    ]