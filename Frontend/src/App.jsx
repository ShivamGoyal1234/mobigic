import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [state, setState] = useState({
    user: null,
    files: [],
    username: "",
    password: "",
    file: null,
    downloadId: "",
    downloadCode: "",
    isLoading: false,
    isUploading: false,
  });
  const [isFileValid, setIsFileValid] = useState(true);

  const {
    user,
    files,
    username,
    password,
    file,
    downloadId,
    downloadCode,
    isLoading,
    isUploading,
  } = state;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchFiles();
  }, []);

  const api = axios.create({
    baseURL: import.meta.env.VITE_APP_API_URL,
    headers: {
      Authorization: localStorage.getItem("token"),
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];

    const allowedFileTypes = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (selectedFile && !allowedFileTypes.includes(selectedFile.type)) {
      alert(
        "Invalid file type. Only JPG, PNG, PDF, and DOC/DOCX files are allowed."
      );
      setIsFileValid(false);
      return;
    }

    setIsFileValid(true);
    setState((prevState) => ({ ...prevState, file: selectedFile }));
  };

  const handleAPIError = (error, notFoundMsg) => {
    if (error.response && error.response.status === 404) {
      alert(notFoundMsg || "Not found");
    } else {
      alert("Something went wrong. Please try again.");
    }
  };

  const register = async () => {
    try {
      await api.post("/register", { username, password });
      alert("Registered successfully");
    } catch (error) {
      handleAPIError(error, "Registration failed");
    }
  };

  const login = async () => {
    try {
      const response = await api.post("/login", { username, password });
      localStorage.setItem("token", response.data.token);
      setState((prevState) => ({ ...prevState, user: username }));
      fetchFiles();
    } catch (error) {
      handleAPIError(error, "Login failed");
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setState((prevState) => ({ ...prevState, user: null, files: [] }));
  };

  const fetchFiles = async () => {
    try {
      const response = await api.get("/files");
      setState((prevState) => ({ ...prevState, files: response.data }));
    } catch (error) {
      handleAPIError(error, "Failed to fetch files");
    }
  };

  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setState((prevState) => ({ ...prevState, isUploading: true }));

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await api.post("/upload", formData);
      alert(`File uploaded. Code: ${response.data.code}`);

      fetchFiles();

      setState((prevState) => ({
        ...prevState,
        file: null,
        isUploading: false,
      }));
    } catch (error) {
      handleAPIError(error, "Upload failed");
      setState((prevState) => ({ ...prevState, isUploading: false }));
    }
  };

  const deleteFile = async (id) => {
    try {
      await api.delete(`/files/${id}`);
      fetchFiles();
    } catch (error) {
      handleAPIError(error, "Failed to delete file");
    }
  };

  const verifyAndDownload = async () => {
    if (!downloadId || !downloadCode) {
      return alert("Please enter both File ID and 6-digit code");
    }
    setState((prevState) => ({ ...prevState, isLoading: true }));

    try {
      await api.post(`/files/verify-code/${downloadId}`, {
        code: downloadCode,
      });
      window.location.href = `${
        import.meta.env.VITE_APP_API_URL
      }/files/download/${downloadId}`;
    } catch (error) {
      handleAPIError(error, "File not found", "Invalid code");
    } finally {
      setState((prevState) => ({ ...prevState, isLoading: false }));
    }
  };

  const renderInput = (
    value,
    name,
    placeholder,
    type = "text",
    disabled = false
  ) => (
    <div style={{ margin: "20px" }}>
      <input
        value={value}
        onChange={handleInputChange}
        name={name}
        placeholder={placeholder}
        type={type}
        disabled={disabled}
      />
    </div>
  );

  return (
    <div>
      {!user ? (
        <div>
          <h1> Mobigic Registration Portal</h1>
          {renderInput(username, "username", "Username")}
          {renderInput(password, "password", "Password", "password")}
          <button onClick={register}>Register</button>
          <button onClick={login}>Login</button>
        </div>
      ) : (
        <div>
          <h2>
            Welcome, {user}
            <button onClick={logout}>Logout</button>
          </h2>
          <input type="file" onChange={handleFileChange} />
          <button onClick={uploadFile} disabled={isUploading || !isFileValid}>
            {isUploading ? "Uploading..." : "Upload"}
          </button>
          <h3>Your Files:</h3>
          <ul>
            {files.map((file) => (
              <li key={file._id}>
                File Id: {file._id} - Code: {file.code}
                <button onClick={() => deleteFile(file._id)}>Delete</button>
              </li>
            ))}
          </ul>
          <div>
            <h3>Download File:</h3>
            {renderInput(
              downloadId,
              "downloadId",
              "File ID",
              "text",
              isLoading
            )}
            {renderInput(
              downloadCode,
              "downloadCode",
              "6-digit code",
              "text",
              isLoading
            )}
            <button onClick={verifyAndDownload} disabled={isLoading}>
              {isLoading ? "Processing..." : "Download"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
