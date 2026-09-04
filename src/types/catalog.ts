/**
 * The standard Activity / Task catalog, managed centrally in Reference Data and
 * referenced everywhere else. Three records, exactly as the client's own system
 * holds them: activities, tasks, and the **many-to-many link** between them —
 * "Conceptual Design" is a task under both Mech / Struct Design and Av / Elec
 * System Design, so a task cannot simply belong to one activity.
 */

export interface Activity {
  id: string
  name: string
  description: string
  /**
   * Time Entry must name a task for this activity. Drives the requirement doc's
   * "hide Task when activity does not require one": with this off, the Task
   * field disappears rather than sitting there empty.
   */
  taskRequired: boolean
  /** Offered first when picking an activity. The client's "Default" column. */
  isDefault: boolean
  /**
   * Holiday, sick leave, training. Real logged hours, but never budgeted and
   * never assignable to a work package, so they are held apart from project
   * work everywhere a budget is calculated.
   */
  nonProject: boolean
  active: boolean
}

export interface Task {
  id: string
  name: string
  active: boolean
}

/** One activity–task association. Carries its own `active` flag, as the
    client's Activity Tasks list does, so a pairing can be retired without
    deleting either side. */
export interface ActivityTask {
  id: string
  activityId: string
  taskId: string
  active: boolean
}
