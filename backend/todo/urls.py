from django.urls import path
from .views import task_list, toggle_task, delete_task

urlpatterns = [
    path("", task_list, name="task_list"),
    path("toggle/<int:task_id>/", toggle_task, name="toggle_task"),
    path("delete/<int:task_id>/", delete_task, name="delete_task"),
]
