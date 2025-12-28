
import React, { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [accessToken, setAccessToken] = useState("");
  const [instanceUrl, setInstanceUrl] = useState("");
  const [rules, setRules] = useState([]);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.replace("#", ""));
      const token = params.get("access_token");
      const instance = params.get("instance_url");
      if (token && instance) {
        setAccessToken(token);
        setInstanceUrl(instance);
        localStorage.setItem("sf_token", token);
        localStorage.setItem("sf_instance_url", instance);
      }
      window.history.replaceState(null, null, window.location.pathname);
    } else {
      const storedToken = localStorage.getItem("sf_token");
      const storedInstance = localStorage.getItem("sf_instance_url");
      if (storedToken && storedInstance) {
        setAccessToken(storedToken);
        setInstanceUrl(storedInstance);
      }
    }
  }, []);

  const toggleRule = (index) => {
    const updatedRules = [...rules];
    updatedRules[index].Active = !updatedRules[index].Active;
    setRules(updatedRules);
  };

  const loginWithSalesforce = () => {
    const clientId =  process.env.REACT_APP_SF_CLIENT_ID;
    const redirectUri = "http://localhost:3000";
    window.location.href =
      `https://login.salesforce.com/services/oauth2/authorize?response_type=token` +
      `&client_id=${clientId}&redirect_uri=${redirectUri}`;
  };

  const getValidationRules = async () => {
    if (!accessToken || !instanceUrl) return alert("Access Token or Instance URL missing!");
    try {
      const res = await axios.post("http://localhost:5000/api/validation-rules", {
        accessToken,
        instanceUrl,
      });
      setRules(res.data.rules);
    } catch (error) {
      console.error("Error fetching rules:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert("Session expired. Please login again.");
        setAccessToken("");
        setInstanceUrl("");
        localStorage.removeItem("sf_token");
        localStorage.removeItem("sf_instance_url");
      } else {
        alert("Error fetching validation rules. Check console.");
      }
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Salesforce Validation Rule Switch</h2>
      {!accessToken ? (
        <button onClick={loginWithSalesforce} style={{ padding: "10px 20px" }}>
          Login with Salesforce
        </button>
      ) : (
        <>
          <h3>Salesforce Login Successful 🎉</h3>
          <button onClick={getValidationRules} style={{ marginTop: 20, padding: "10px 20px" }}>
            Get Validation Rules
          </button>
          <div style={{ marginTop: 20 }}>
            {rules.length === 0 ? (
              <p>No rules fetched yet.</p>
            ) : (
              <ul>
                {rules.map((rule, index) => (
                  <li key={index} style={{ marginBottom: 10 }}>
                    <strong>{rule.ValidationName}</strong>{" "}
                    
                    <span style={{ marginLeft: 10 }}>
                      Status:{" "}
                      <b style={{ color: rule.Active ? "green" : "red" }}>
                        {rule.Active ? "Active" : "Inactive"}
                      </b>
                    </span>

                    <button
                      onClick={() => toggleRule(index)}
                      style={{
                        marginLeft: 20,
                        padding: "5px 10px",
                        cursor: "pointer",
                      }}
                    >
                      Toggle
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
