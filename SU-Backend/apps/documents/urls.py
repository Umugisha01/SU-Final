from django.urls import path
from apps.documents.views import (
    DocumentListUploadView, DocumentDownloadView, DocumentShareView, DocumentDeleteView
)

urlpatterns = [
    path('', DocumentListUploadView.as_view(), name='document_list_upload'),
    path('<int:id>/download', DocumentDownloadView.as_view(), name='document_download'),
    path('<int:id>/share', DocumentShareView.as_view(), name='document_share'),
    path('<int:id>', DocumentDeleteView.as_view(), name='document_delete'),
]
