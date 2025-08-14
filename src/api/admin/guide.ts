import axios from "axios";

const BackendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const BackendAPI = axios.create({
    baseURL: `${BackendURL}`,
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    withCredentials: false,
});

// Guide Create Function
export const GuideCreate = async (formData: FormData) => {
    try {
        console.log("GuideCreate called with FormData:", formData);
        
        // Use admin endpoint
        const res = await BackendAPI.post("/api/admin/guides", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        
        console.log("GuideCreate response:", res);
        return res.data;
    } catch (error: any) {
        console.error("Guide creation error:", error);
        throw error;
    }
};

// Guide Update Function
export const UpdateGuide = async (id: number, data: any) => {
    try {
        const formData = new FormData();

        // Laravel method spoofing
        formData.append("_method", "PUT");

        // Main guide fields
        formData.append("title", data.title);
        formData.append("audience", data.audience);
        formData.append("description", data.description);

        // Steps
        data.steps.forEach((step: any, i: number) => {
            formData.append(`steps[${i}][title]`, step.title);
            formData.append(`steps[${i}][description]`, step.description);
            if (step.videoFile) {
                formData.append(`steps[${i}][videoFile]`, step.videoFile);
            }
        });

        // Send request
        const res = await BackendAPI.post(`/api/admin/guides/${id}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        return res.data;

    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || "Erro ao atualizar guia");
        }
        throw new Error("Erro na conexão com o servidor");
    }
};

// Guide Remove Function
export const RemoveGuide = async (id: number) => {
    try {
        const res = await BackendAPI.delete(`/api/admin/guides/${id}`);
        return res.data;
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || "Erro ao remover guia");
        }
        throw new Error("Erro na conexão com o servidor");
    }
};

// Guide Get Function (public)
export const GetGuide = async () => {
    try {
        const res = await BackendAPI.get("/api/guides");
        return res.data; // returns array of guides with their steps
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || "Erro ao obter guias");
        }
        throw new Error("Erro na conexão com o servidor");
    }
};

// Guide Get Admin Function
export const GetAdminGuides = async () => {
    try {
        const res = await BackendAPI.get("/api/admin/guides");
        return res.data; // returns array of guides with their steps
    } catch (error: any) {
        if (error.response) {
            throw new Error(error.response.data.message || "Erro ao obter guias");
        }
        throw new Error("Erro na conexão com o servidor");
    }
};