# Generated by Django 2.0.3 on 2018-06-15 07:53

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('ordenes', '0006_auto_20180602_2351'),
    ]

    operations = [
        migrations.CreateModel(
            name='Cliente',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('firstname', models.CharField(max_length=63)),
                ('lastname', models.CharField(max_length=63)),
                ('secondname', models.CharField(blank=True, max_length=63)),
                ('surname', models.CharField(blank=True, max_length=63)),
                ('contact_1', models.PositiveIntegerField()),
                ('contact_2', models.PositiveIntegerField(null=True)),
                ('uuid', models.UUIDField(db_index=True, default=uuid.uuid4, editable=False)),
            ],
        ),
        migrations.AlterUniqueTogether(
            name='cliente',
            unique_together={('firstname', 'lastname', 'contact_1')},
        ),
    ]
