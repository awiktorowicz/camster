class UniqueNameSet extends Set {
  constructor(values: any) {
    super(values);

    const names: any = [];
    for (let value of this) {
      if (names.includes(value.name)) {
        this.delete(value);
      } else {
        names.push(value.name);
      }
    }
  }
}

class AnimationManager {
  private tasks: any = new UniqueNameSet([]);
  private fps: number = 60; // Target FPS
  private lastFrameTime: number = performance.now();
  private animationId: number | null = null; // Store the animation frame ID

  private run = (currentTime: number) => {
    const deltaTime = currentTime - this.lastFrameTime;

    // Ensure the tasks only run if enough time has passed to meet the target FPS
    if (deltaTime > 1000 / this.fps) {
      this.tasks.forEach((task: any) => {
        const taskDeltaTime = currentTime - task.lastFrameTime;
        if (taskDeltaTime > 1000 / task.fps) {
          task.task(currentTime);
          task.lastFrameTime = currentTime;
        }
      });
      this.lastFrameTime = currentTime;
    }

    this.animationId = requestAnimationFrame(this.run);
  };

  public registerTask(task: FrameRequestCallback, fps: number) {
    this.tasks.add({ task, fps, name: task.toString(), lastFrameTime: 0 });
    if (this.tasks.size === 1) {
      this.animationId = requestAnimationFrame(this.run); // Start the loop if this is the first task
    }
  }

  public unregisterTask(task: FrameRequestCallback) {
    this.tasks.delete(task);
    if (this.tasks.size === 0 && this.animationId !== null) {
      cancelAnimationFrame(this.animationId); // Stop the loop if no tasks remain
      this.animationId = null; // Reset the ID
    }
  }
}

export const animationManager = new AnimationManager();
