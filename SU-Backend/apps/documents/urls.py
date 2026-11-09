from django.urls import re_path
from apps.documents.views import (
    DocumentListUploadView, DocumentDownloadView, DocumentShareView, DocumentDetailView
)

urlpatterns = [
    re_path(r'^$', DocumentListUploadView.as_view(), name='document_list_upload'),
    re_path(r'^(?P<id>\d+)/download/?$', DocumentDownloadView.as_view(), name='document_download'),
    re_path(r'^(?P<id>\d+)/share/?$', DocumentShareView.as_view(), name='document_share'),
    re_path(r'^(?P<id>\d+)/?$', DocumentDetailView.as_view(), name='document_detail'),
]
