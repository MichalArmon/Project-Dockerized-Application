from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import AllowAny

from .models import Task
from .serializers import TaskSerializer


class TaskViewSet(ModelViewSet):
    queryset = Task.objects.all().order_by("-created_at")
    serializer_class = TaskSerializer
    authentication_classes = []
    permission_classes = [AllowAny]
