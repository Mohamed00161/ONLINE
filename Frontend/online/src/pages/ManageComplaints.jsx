import { useEffect, useState } from "react";


const ManageComplaints = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    API.get("https://online-backend-8khb.onrender.com/api/complaints")
      .then((res) => setComplaints(res.data))
      .catch(() => alert("Error"));
  }, []);

  const updateStatus = async (id, status) => {
    await API.put(`https://online-backend-8khb.onrender.com/api/complaints/${id}`, { status });
    setComplaints(
      complaints.map((c) =>
        c._id === id ? { ...c, status } : c
      )
    );
  };

  return (
    <div>
      <h2>Admin Complaints</h2>

      {complaints.map((c) => (
        <div key={c._id}>
          <h4>{c.title}</h4>
          <p>User: {c.user.email}</p>
          <p>Status: {c.status}</p>

          <button onClick={() => updateStatus(c._id, "In Progress")}>
            In Progress
          </button>
          <button onClick={() => updateStatus(c._id, "Resolved")}>
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
};

export default ManageComplaints;
