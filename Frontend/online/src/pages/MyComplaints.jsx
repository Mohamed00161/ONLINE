import { useEffect, useState } from "react";


const MyComplaints = () => {
  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    API.get("https://online-backend-8khb.onrender.com/api/complaints")
      .then((res) => setComplaints(res.data))
      .catch(() => alert("Error fetching complaints"));
  }, []);

  return (
    <div>
      <h2>My Complaints</h2>

      {complaints.map((c) => (
        <div key={c._id}>
          <h4>{c.title}</h4>
          <p>{c.description}</p>
          <span>Status: {c.status}</span>
        </div>
      ))}
    </div>
  );
};

export default MyComplaints;
