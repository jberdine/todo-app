import { useState } from "react";
import Select from "react-select";
import { useSKDB, useQuery } from "skdb-react";
import "./App.css";

interface Task {
  id: number;
  name: string;
  complete: number;
}

function TasksTable({
  completed,
  filter,
}: {
  completed: boolean;
  filter: string;
}) {
  const tasks = useQuery(
    "SELECT * FROM tasks WHERE name LIKE @filt AND complete = @completed;",
    { filt: "%" + filter + "%", completed: completed ? 1 : 0 },
  ) as Array<Task>;
  const acc = [];
  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    acc.push(<TaskRow task={t} key={t.id} />);
  }
  return (
    (!completed || tasks.length > 0) && (
      <div>
        <h4>{completed ? "Done" : "To-Do"}</h4>
        <table>
          <tbody>{acc}</tbody>
        </table>
      </div>
    )
  );
}

function TaskRow({ task }: { task: Task }) {
  const skdb = useSKDB();

  const isComplete = task.complete === 1;

  const del = (id: number) => {
    skdb.exec("DELETE FROM tasks WHERE id = @id;", { id });
  };

  const complete = (id: number, complete: boolean) => {
    const completed = complete ? 1 : 0;
    skdb.exec("UPDATE tasks SET complete = @completed WHERE id = @id;", {
      id,
      completed,
    });
  };

  const taskDisplay = isComplete ? (
    <span>
      <s>{task.name}</s>
    </span>
  ) : (
    <span>{task.name}</span>
  );
  return (
    <tr>
      <td>{taskDisplay}</td>
      <td>
        <button onClick={(_e) => del(task.id)}>Delete</button>
      </td>
      <td>
        <input
          type="checkbox"
          checked={isComplete}
          onChange={(e) => complete(task.id, e.target.checked)}
        />
      </td>
    </tr>
  );
}

function Filter({
  text,
  onChange,
}: {
  text: string;
  onChange: (text: string) => void;
}) {
  return (
    <div className="filter">
      <span>Filter: </span>
      <input value={text} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function AddTasks() {
  const skdb = useSKDB();
  const [taskName, setTaskName] = useState("");

  const addTask = async (name: string) => {
    skdb.exec(
      "INSERT INTO tasks (name, complete, skdb_access) VALUES (@name, 0, 'read-write');",
      { name },
    );
    setTaskName("");
  };

  // 13 is keycode for enter
  const onKeyDown = ({ keyCode }: { keyCode: number }) => {
    if (keyCode == 13) addTask(taskName);
  };

  return (
    <div className="new">
      <span>Name: </span>
      <input
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button onClick={(_e) => addTask(taskName)}>Add Task</button>
    </div>
  );
}

function TaskSummary() {
  const counts = useQuery(
    "SELECT complete, count(*) AS n FROM tasks GROUP BY complete;",
  );

  let completed = 0;
  let uncompleted = 0;

  for (const summary of counts) {
    if (summary.complete === 1) {
      completed = summary.n;
    } else {
      uncompleted = summary.n;
    }
  }
  const sum = completed + uncompleted;

  return (
    <div>
      <h2>Tasks</h2>
      <span>
        There are {sum} tasks: {completed} completed and {uncompleted}{" "}
        uncompleted.
      </span>
    </div>
  );
}

function App() {
  const [filterText, setFilterText] = useState("");

  return (
    <>
      <TaskSummary />
      <AddTasks />
      <hr />
      <Filter text={filterText} onChange={setFilterText} />
      <TasksTable completed={false} filter={filterText} />
      <TasksTable completed={true} filter={filterText} />
    </>
  );
}

export default App;
