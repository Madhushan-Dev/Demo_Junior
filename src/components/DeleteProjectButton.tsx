import React from "react";
import { deleteProject } from "../services/projectService";
import { Button } from "./ui/Button";

interface Props {
    projectId: number;

}

const DeleteProjectButton: React.FC<Props> = ({ projectId}) => {
    const handleDelete = async () => {
        try {
            await deleteProject(projectId);
            alert("Project deleted Successsfully");
        } catch (error) {
            alert("Faild to deleted successfully");
        }
    };
    return (
        <Button onClick={handleDelete} style={{ background: "red", color: "white" }}>Delete Project</Button>
    );

};

export default DeleteProjectButton;