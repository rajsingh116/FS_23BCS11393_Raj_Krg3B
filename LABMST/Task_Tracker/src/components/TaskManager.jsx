import React, { useState } from "react";
import useForm from "../hooks/useForm";

const TaskManager = () => {

  const [tasks, setTasks] = useState([]);

  const { values, handleChange, resetForm } = useForm({
    title: "",
    priority: "Low"
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTask = {
      title: values.title,
      priority: values.priority
    };

    setTasks([...tasks, newTask]);

    resetForm();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Task Tracker</h2>

      <form onSubmit={handleSubmit}>

        <div>
          <label>Task Title</label>
          <br />
          <input
            type="text"
            name="title"
            value={values.title}
            onChange={handleChange}
            required
          />
        </div>

        <br />

        <div>
          <label>Priority</label>
          <br />
          <select
            name="priority"
            value={values.priority}
            onChange={handleChange}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <br />

        <button type="submit">Add Task</button>

      </form>

      <hr />

      <h3>Task List</h3>

      {tasks.length === 0 ? (
        <p>No tasks added</p>
      ) : (
        tasks.map((task, index) => (
          <div key={index}>
            {task.title} | {task.priority}
          </div>
        ))
      )}
    </div>
  );
};

export default TaskManager;