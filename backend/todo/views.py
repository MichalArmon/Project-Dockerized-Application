from django.shortcuts import render, redirect, get_object_or_404
from .models import Task


def task_list(request):
    if request.method == "POST":
        title = request.POST.get("title")

        if title:
            Task.objects.create(title=title)

        return redirect("task_list")

    tasks = Task.objects.all().order_by("-created_at")
    total_tasks = Task.objects.count()
    completed_tasks = Task.objects.filter(completed=True).count()
    open_tasks = Task.objects.filter(completed=False).count()

    return render(
        request,
        "todo/task_list.html",
        {
            "tasks": tasks,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "open_tasks": open_tasks,
        },
    )


def toggle_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)

    task.completed = not task.completed
    task.save()

    return redirect("task_list")


def delete_task(request, task_id):
    task = get_object_or_404(Task, id=task_id)
    task.delete()

    return redirect("task_list")
