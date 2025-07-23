import React, { useRef, useState } from "react";
import { Input } from "../ui/input";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem
} from "../ui/select";
import { UploadIcon, XIcon } from "lucide-react";

const BRAZILIAN_STATES = [
  "Acre",
  "Alagoas",
  "Amapá",
  "Amazonas",
  "Bahia",
  "Ceará",
  "Distrito Federal",
  "Espírito Santo",
  "Goiás",
  "Maranhão",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Pará",
  "Paraíba",
  "Paraná",
  "Pernambuco",
  "Piauí",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondônia",
  "Roraima",
  "Santa Catarina",
  "São Paulo",
  "Sergipe",
  "Tocantins"
];

const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

const MAX_IMAGE_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png"];

const defaultProfile = {
    name: "Andrii Kerrn",
    email: "andriikerrn@gmail.com",
    state: "São Paulo",
    role: "UGC e Influencer",
    languages: ["Portuguese", "English"],
    gender: "Feminine",
    categories: ["Fashion", "Lifestyle", "Beauty"],
    image: null as File | null,
};

export const EditProfile: React.FC<{
    initialProfile?: typeof defaultProfile;
    onCancel: () => void;
    onSave: (profile: typeof defaultProfile) => void;
    isLoading?: boolean;
}> = ({ initialProfile = defaultProfile, onCancel, onSave, isLoading = false }) => {
    const [profile, setProfile] = useState({ ...initialProfile });
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [error, setError] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_TYPES.includes(file.type)) {
            setError("Only JPG and PNG files are allowed.");
            return;
        }
        if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
            setError("Max file size is 2MB.");
            return;
        }
        setProfile((p) => ({ ...p, image: file }));
        setImagePreview(URL.createObjectURL(file));
        setError("");
    };

    const handleRemoveImage = () => {
        setProfile((p) => ({ ...p, image: null }));
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setProfile((p) => ({ ...p, [name]: value }));
    };

    const handleLanguagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const languagesString = e.target.value;
        const languagesArray = languagesString.split(",").map((l) => l.trim()).filter(l => l.length > 0);
        setProfile((p) => ({ ...p, languages: languagesArray }));
    };

    // Convert languages array to string for display
    const languagesDisplay = Array.isArray(profile.languages) 
        ? profile.languages.join(", ") 
        : profile.languages || "";

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(profile);
    };

    return (
        <div className="min-h-[92vh] bg-gray-50 dark:bg-[#171717] p-6">
            <form
                className="w-full bg-background rounded-xl shadow-sm border border-gray-200 dark:border-neutral-700 p-6 mt-6"
                onSubmit={handleSave}
            >
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Edit Profile</h2>
                {/* Profile picture */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative w-24 h-24">
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Profile preview"
                                className="w-24 h-24 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-[#AA61EF]/50 dark:bg-[#181818] flex items-center justify-center text-3xl font-bold text-purple-600 dark:text-white">
                                {getInitials(profile.name)}
                            </div>
                        )}
                        <button
                            type="button"
                            disabled={isLoading}
                            className="absolute bottom-0 right-0 bg-[#E91E63] hover:bg-[#E91E63] disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full p-2 shadow-md focus:outline-none"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Upload profile picture"
                        >
                            <UploadIcon className="w-3 h-3" />
                        </button>
                        {imagePreview && (
                            <button
                                type="button"
                                disabled={isLoading}
                                className="absolute top-0 right-0 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1 focus:outline-none"
                                onClick={handleRemoveImage}
                                aria-label="Remove profile picture"
                            >
                                <XIcon className="w-3 h-3" />
                            </button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900 dark:text-white">Profile picture</div>
                        <div className="text-xs text-gray-400 mt-1">Recommended: JPG, PNG. Max 2MB</div>
                    </div>
                </div>
                {/* Form fields */}
                <div className="grid grid-cols-1 gap-8">
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <Input
                            id="name"
                            name="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={profile.name}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="name"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Enter your email"
                            value={profile.email}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="email"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                        <Select
                            value={profile.state}
                            onValueChange={val => setProfile(p => ({ ...p, state: val }))}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2 text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 text-base">
                                <SelectValue placeholder="Select your state" />
                            </SelectTrigger>
                            <SelectContent>
                                {BRAZILIAN_STATES.map((state) => (
                                    <SelectItem key={state} value={state}>
                                        {state}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
                        <Input
                            id="role"
                            name="role"
                            type="text"
                            placeholder="Enter your role"
                            value={profile.role}
                            onChange={handleChange}
                            disabled={isLoading}
                            required
                            autoComplete="role"
                        />
                        <span className="text-xs text-gray-400 mt-1">This helps brands understand your profile.</span>
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Spoken languages</label>
                        <Input
                            id="languages"
                            name="languages"
                            type="text"
                            placeholder="e.g. English, Spanish, Portuguese"
                            value={languagesDisplay}
                            onChange={handleLanguagesChange}
                            disabled={isLoading}
                            required
                            autoComplete="languages"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="font-medium text-gray-700 dark:text-gray-300 mb-1">Gender <span className="text-xs text-gray-400">(Optional)</span></label>
                        <Select
                            value={profile.gender}
                            onValueChange={val => setProfile(p => ({ ...p, gender: val }))}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-md px-4 py-2 text-gray-900 dark:text-white outline-none placeholder-gray-400 dark:placeholder-gray-500 text-base">
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Non-binary">Non-binary</SelectItem>
                                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-xs text-gray-400 mt-1">Optional field</span>
                    </div>
                </div>
                {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#E91E63] hover:bg-pink-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold px-6 py-2 rounded-md flex items-center gap-2"
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {isLoading ? "Saving..." : "Save changes"}
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        className="bg-white dark:bg-neutral-900 text-gray-700 dark:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2 rounded-md focus:outline-none"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile; 