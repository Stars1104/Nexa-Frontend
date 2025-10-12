import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useAppDispatch } from '../../store/hooks';
import { fetchPortfolio, updatePortfolioProfile, uploadPortfolioMedia, deletePortfolioItem } from '../../store/slices/portfolioSlice';
import { testUpload, testUpdate } from '../../api/portfolio';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Camera, Loader2, Plus } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { getAvatarUrl } from '../../lib/utils';

const MAX_BIO_LENGTH = 500;
const MAX_FILES_PER_UPLOAD = 5;
const MAX_TOTAL_FILES = 12;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/jpg", "video/mp4", "video/quicktime", "video/mov", "video/avi", "video/mpeg", "video/x-msvideo", "video/webm", "video/ogg", "video/x-matroska", "video/x-flv", "video/3gpp", "video/x-ms-wmv", "application/octet-stream"];

// Function to get user initials from name
const getInitials = (name: string) => {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
};

function getFileType(file: File) {
    if (file.type.startsWith("image/")) return "image";
    if (file.type.startsWith("video/")) return "video";
    return "other";
}

export default function Portfolio() {
    const dispatch = useAppDispatch();
    const { user } = useSelector((state: RootState) => state.auth);
    const { portfolio, isLoading, error } = useSelector((state: RootState) => state.portfolio);
    const { toast } = useToast();

    // State for profile editing
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [profileTitle, setProfileTitle] = useState('');
    const [bio, setBio] = useState('');
    const [profilePic, setProfilePic] = useState<string | null>(null);
    const [projectLinks, setProjectLinks] = useState<{title: string; url: string}[]>([]);
    const profilePicInputRef = useRef<HTMLInputElement>(null);

    // State for portfolio editing
    const [isPortfolioEditDialogOpen, setIsPortfolioEditDialogOpen] = useState(false);
    const [media, setMedia] = useState<Array<{ file: File; url: string; type: string }>>([]);
    const [dragActive, setDragActive] = useState(false);
    const mediaInputRef = useRef<HTMLInputElement>(null);

    // State for image modal
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    // State for video modal
    const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

    // State for saving
    const [isSaving, setIsSaving] = useState(false);

    // Load portfolio data on component mount
    useEffect(() => {
        if (user?.id) {
            const token = localStorage.getItem('token');
            if (token) {
                dispatch(fetchPortfolio(token));
            }
        }
    }, [dispatch, user?.id]);

    // Update local state when portfolio data is loaded
    useEffect(() => {
        if (portfolio) {

            setBio(portfolio.bio || "");
            setProfileTitle(portfolio.title || "");
            setProfilePic(portfolio.profile_picture_url || null);
            
            // Handle project links with backward compatibility
            if (portfolio.project_links && portfolio.project_links.length > 0) {
                const links = portfolio.project_links.map((link: any, index: number) => {
                    if (typeof link === 'string') {
                        // Legacy string format
                        return { title: `Projeto ${index + 1}`, url: link };
                    } else {
                        // New object format
                        return { title: link.title || `Projeto ${index + 1}`, url: link.url || '' };
                    }
                });
                setProjectLinks(links);
            } else {
                setProjectLinks([{title: '', url: ''}]);
            }
        }
    }, [portfolio]);

    // Show error toast if there's an error
    useEffect(() => {
        if (error) {
            toast({
                title: "Erro",
                description: error,
                variant: "destructive",
            });
        }
    }, [error, toast]);

    // --- Media Upload Logic ---
    const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        addMediaFiles(files);
        e.target.value = ""; // reset input
    };

    const addMediaFiles = (files: File[]) => {
        console.log('addMediaFiles called with:', files);
        
        let validFiles = files.filter(
            (file) => ACCEPTED_TYPES.includes(file.type)
        );
        
        console.log('Valid files after filtering:', validFiles);

        const currentMediaCount = media.length + (portfolio?.items?.length || 0);
        if (currentMediaCount + validFiles.length > MAX_TOTAL_FILES) {
            validFiles = validFiles.slice(0, MAX_TOTAL_FILES - currentMediaCount);
        }
        validFiles = validFiles.slice(0, MAX_FILES_PER_UPLOAD);

        const newMedia = validFiles.map((file) => ({
            file,
            url: URL.createObjectURL(file),
            type: getFileType(file),
        }));
        
        console.log('New media to add:', newMedia);
        setMedia((prev) => {
            const updated = [...prev, ...newMedia];
            console.log('Updated media state:', updated);
            return updated;
        });
    };

    const handleRemoveMedia = (idx: number) => {
        setMedia((prev) => {
            URL.revokeObjectURL(prev[idx].url);
            return prev.filter((_, i) => i !== idx);
        });
    };

    // Drag and drop
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
    };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        const files = Array.from(e.dataTransfer.files || []);
        addMediaFiles(files);
    };

    const handleSaveProfile = async () => {
        if (!user?.id) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');
            
            const formData = new FormData();

            // Ensure we have valid values
            const titleToSend = profileTitle?.trim() || '';
            const bioToSend = bio?.trim() || '';

            formData.append('title', titleToSend);
            formData.append('bio', bioToSend);

            // Add project links
            let validLinks = [];
            if (projectLinks && projectLinks.length > 0) {
                validLinks = projectLinks.filter(link =>
                    link &&
                    link.title &&
                    link.url &&
                    link.title.trim() !== '' &&
                    link.url.trim() !== ''
                );
            }
            // Always append project_links, even if empty, to allow clearing
            formData.append('project_links', JSON.stringify(validLinks));

            if (profilePic && profilePic.startsWith('blob:')) {
                const response = await fetch(profilePic);
                const blob = await response.blob();
                formData.append('profile_picture', blob, 'profile.jpg');
            }

            console.log("123123", formData);

            const result = await dispatch(updatePortfolioProfile({ token, data: formData })).unwrap();
            
            // Refresh portfolio data to ensure UI is up to date
            await dispatch(fetchPortfolio(token));

            setIsEditDialogOpen(false);
            toast({
                title: "Sucesso!",
                description: "Perfil atualizado com sucesso!",
                duration: 3000,
            });
        } catch (error) {
            console.error('Profile update error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                status: error.status
            });
            toast({
                title: "Erro",
                description: "Falha ao atualizar perfil. Tente novamente.",
                duration: 3000,
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestUpdate = async () => {
        if (!user?.id) return;

        console.log('handleTestUpdate called with:', {
            profileTitle,
            bio,
            projectLinks
        });

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token de autenticação não encontrado');

            const formData = new FormData();
            formData.append('title', profileTitle?.trim() || '');
            formData.append('bio', bio?.trim() || '');

            const result = await testUpdate(token, formData);
            console.log('Test update result:', result);
            
            toast({
                title: "Teste de Update Concluído",
                description: "Teste de update realizado com sucesso! Verifique o console para detalhes.",
                duration: 3000,
            });
        } catch (error) {
            console.error('Test update error:', error);
            toast({
                title: "Erro no Teste de Update",
                description: "Falha no teste de update. Verifique o console para detalhes.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleTestUpload = async () => {
        if (!user?.id || !portfolio) return;

        console.log('handleTestUpload called with media:', media);

        // Check if there are files to upload
        if (media.length === 0) {
            console.log('No media files to upload');
            toast({
                title: "Aviso",
                description: "Nenhum arquivo selecionado para upload.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token de autenticação não encontrado');

            // Test upload
            const files = media.map(item => item.file);
            console.log('Files to test upload:', files);
            const result = await testUpload(token, files);
            console.log('Test upload result:', result);
            
            toast({
                title: "Teste Concluído",
                description: "Teste de upload realizado com sucesso!",
                duration: 3000,
            });
        } catch (error) {
            console.error('Test upload error:', error);
            toast({
                title: "Erro no Teste",
                description: "Falha no teste de upload. Verifique o console para detalhes.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePortfolio = async () => {
        if (!user?.id || !portfolio) return;

        console.log('handleSavePortfolio called with media:', media);

        // Check if there are files to upload
        if (media.length === 0) {
            console.log('No media files to upload');
            toast({
                title: "Aviso",
                description: "Nenhum arquivo selecionado para upload.",
                variant: "destructive",
            });
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token de autenticação não encontrado');

            // Upload new media files
            const files = media.map(item => item.file);
            console.log('Files to upload:', files);
            await dispatch(uploadPortfolioMedia({ token, files })).unwrap();

            setMedia([]);
            setIsPortfolioEditDialogOpen(false);
            toast({
                title: "Sucesso!",
                description: "Portfólio adicionado com sucesso!",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao adicionar portfólio. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const handleRemovePortfolioItem = async (itemId: number) => {
        if (!portfolio) return;

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token de autenticação não encontrado');

            await dispatch(deletePortfolioItem({ token, itemId })).unwrap();
            toast({
                title: "Sucesso!",
                description: "Portfólio removido com sucesso!",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao remover portfólio. Tente novamente.",
                variant: "destructive",
            });
        }
    };

    const handleSavePortfolioComplete = async () => {
        if (!user?.id) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Token de autenticação não encontrado');

            const formData = new FormData();
            formData.append('title', profileTitle);
            formData.append('bio', bio);

            // Add project links
            let validLinks = [];
            if (projectLinks && projectLinks.length > 0) {
                validLinks = projectLinks.filter(link =>
                    link &&
                    link.title &&
                    link.url &&
                    link.title.trim() !== '' &&
                    link.url.trim() !== ''
                );
            }
            // Always append project_links, even if empty, to allow clearing
            formData.append('project_links', JSON.stringify(validLinks));

            if (profilePic && profilePic.startsWith('blob:')) {
                const response = await fetch(profilePic);
                const blob = await response.blob();
                formData.append('profile_picture', blob, 'profile.jpg');
            }

            await dispatch(updatePortfolioProfile({ token, data: formData })).unwrap();

            toast({
                title: "Sucesso!",
                description: "Portfólio salvo com sucesso!",
                duration: 3000,
            });
        } catch (error) {
            toast({
                title: "Erro",
                description: "Falha ao salvar portfólio. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Get user avatar
    const getUserAvatar = () => {
        if (profilePic) return getAvatarUrl(profilePic);
        if (user?.avatar_url) return getAvatarUrl(user.avatar_url);
        if (user?.avatar) return getAvatarUrl(user.avatar);
        return null;
    };

    // Get user name
    const getUserName = () => {
        return user?.name || "User";
    };

    // Get total media count
    const getTotalMediaCount = () => {
        const existingItems = portfolio?.items?.length || 0;
        return existingItems + media.length;
    };

    // Project links management
    const addProjectLink = () => {
        setProjectLinks([...projectLinks, {title: '', url: ''}]);
    };

    const updateProjectLink = (index: number, field: 'title' | 'url', value: string) => {
        const newLinks = [...projectLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setProjectLinks(newLinks);
    };

    const removeProjectLink = (index: number) => {
        const newLinks = projectLinks.filter((_, i) => i !== index);
        setProjectLinks(newLinks);
    };

    // Image modal handlers
    const handleImageClick = (imageUrl: string) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    const handleCloseImageModal = () => {
        setIsImageModalOpen(false);
        setSelectedImage(null);
    };

    // Video modal handlers
    const handleVideoClick = (videoUrl: string) => {
        setSelectedVideo(videoUrl);
        setIsVideoModalOpen(true);
    };

    const handleCloseVideoModal = () => {
        setIsVideoModalOpen(false);
        setSelectedVideo(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Carregando portfólio...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 w-full mx-auto min-h-screen dark:bg-[#171717]">
            {/* Info Banner */}
            <div className="rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-4 py-3 text-sm flex items-center gap-2 border border-purple-200 dark:border-purple-800">
                <span className="font-semibold">Dica:</span>
                <span>Um portfólio bem completo aumenta suas chances de ser aprovado! <span role="img" aria-label="rocket">🚀</span></span>
            </div>

            {/* Profile Section */}
            <section className="rounded-xl border bg-card p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
                <h2 className="font-semibold text-base sm:text-lg mb-2">Perfil</h2>
                <div className="flex flex-col items-start gap-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="relative w-28 h-28 flex-shrink-0">
                            <div className="w-28 h-28 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center bg-muted overflow-hidden">
                                {getUserAvatar() ? (
                                    <img 
                                        src={getUserAvatar()} 
                                        alt="Profile" 
                                        className="object-cover w-full h-full rounded-full"
                                        onError={(e) => {
                                            // Fallback to initials if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent) {
                                                parent.innerHTML = `<div class="w-full h-full rounded-full bg-purple-100 dark:bg-[#E91E63] flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-white">${getInitials(getUserName())}</div>`;
                                            }
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full rounded-full bg-purple-100 dark:bg-[#E91E63] flex items-center justify-center text-2xl font-bold text-purple-600 dark:text-white">
                                        {getInitials(getUserName())}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 text-xs text-muted-foreground space-y-1">
                            <div>
                                <span className="font-semibold text-3xl">{getUserName()}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-2xl">{profileTitle}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 mt-6">
                        <div className="text-lg text-muted-foreground whitespace-pre-wrap">
                            {bio}
                        </div>
                    </div>
                    
                    {/* Project Links Display */}
                    {projectLinks && projectLinks.length > 0 && (
                        <div className="flex flex-col gap-2 mt-4">
                            <h3 className="font-semibold text-base">Projetos Anteriores</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {projectLinks
                                    .filter((link: any) => {
                                        if (typeof link === 'string') {
                                            return link && link.trim() !== '';
                                        }
                                        return link && link.url && link.url.trim() !== '';
                                    })
                                    .map((link, index) => {
                                        const linkData = typeof link === 'string' 
                                            ? { title: `Projeto ${index + 1}`, url: link }
                                            : { title: link.title || `Projeto ${index + 1}`, url: link.url || '' };
                                        
                                        return (
                                            <a
                                                key={index}
                                                href={linkData.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors group"
                                            >
                                                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                                                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                    </svg>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-medium text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                        {linkData.title}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground truncate">
                                                        {linkData.url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                    </div>
                                                </div>
                                                <svg className="w-4 h-4 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex flex-col gap-2 mt-6">
                        <div className="flex gap-2">
                            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                                <DialogTrigger asChild>
                                    <button className="bg-[#E91E63] hover:bg-pink-600 text-white font-semibold px-8 py-2 rounded-md text-base">Editar Perfil</button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby="edit-profile-description">
                                <DialogHeader>
                                    <DialogTitle>Editar Perfil</DialogTitle>
                                </DialogHeader>
                                <div id="edit-profile-description" className="sr-only">
                                    Edite seu perfil de portfólio incluindo título, biografia e links de projetos
                                </div>
                                <div className="flex flex-col gap-4 py-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1" htmlFor="profileTitle">Perfil Título</label>
                                        <input
                                            id="profileTitle"
                                            type="text"
                                            className="w-full rounded-md border px-3 py-2 text-base bg-background text-foreground outline-none transition placeholder:text-muted-foreground"
                                            placeholder="Editor de vídeo sênior"
                                            value={profileTitle}
                                            onChange={(e) => setProfileTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1" htmlFor="bio">Bio</label>
                                        <textarea
                                            id="bio"
                                            className="w-full rounded-md border px-3 py-2 text-base bg-background text-foreground outline-none transition placeholder:text-muted-foreground min-h-[100px] resize-none"
                                            placeholder="Conte um pouco sobre você e sua experiência..."
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            maxLength={MAX_BIO_LENGTH}
                                        />
                                        <div className="text-xs text-muted-foreground mt-1">
                                            {bio.length}/{MAX_BIO_LENGTH} caracteres
                                        </div>
                                    </div>
                                    
                                    {/* Project Links Section */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Links de Projetos Anteriores</label>
                                        <div className="space-y-2">
                                            {projectLinks.map((link, index) => (
                                                <div key={index} className="space-y-2 p-3 border rounded-lg bg-muted/20">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm font-medium">Projeto {index + 1}</span>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => removeProjectLink(index)}
                                                            className="px-2 h-6"
                                                        >
                                                            ×
                                                        </Button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground outline-none transition placeholder:text-muted-foreground"
                                                        placeholder="Título do Projeto"
                                                        value={link.title}
                                                        onChange={(e) => updateProjectLink(index, 'title', e.target.value)}
                                                    />
                                                    <input
                                                        type="url"
                                                        className="w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground outline-none transition placeholder:text-muted-foreground"
                                                        placeholder="https://exemplo.com/meu-projeto"
                                                        value={link.url}
                                                        onChange={(e) => updateProjectLink(index, 'url', e.target.value)}
                                                    />
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addProjectLink}
                                                className="w-full"
                                                disabled={projectLinks.length >= 10}
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Adicionar Link
                                            </Button>
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Adicione links para seus projetos anteriores (máximo 10 links)
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditDialogOpen(false)}
                                        disabled={isSaving}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="bg-[#E91E63] hover:bg-pink-600 text-white"
                                        onClick={handleSaveProfile}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Salvar
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                </div>
            </section>

            {/* Portfolio Section */}
            <section className="rounded-xl border bg-card p-4 sm:p-6 flex flex-col gap-4 shadow-sm">
                <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-base sm:text-lg">Portfólio</h2>
                    <Dialog open={isPortfolioEditDialogOpen} onOpenChange={setIsPortfolioEditDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-[#E91E63] hover:bg-pink-600 text-white font-semibold px-6 py-2 rounded-md">
                                Add Portfólio
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto" aria-describedby="add-portfolio-description">
                            <DialogHeader>
                                <DialogTitle>Adicionar Trabalhos ao Portfólio</DialogTitle>
                            </DialogHeader>
                            <div id="add-portfolio-description" className="sr-only">
                                Adicione trabalhos ao seu portfólio fazendo upload de imagens e vídeos
                            </div>
                            <div className="flex flex-col gap-6 py-4">
                                <div>
                                    <h3 className="font-semibold text-base mb-4">Upload de Mídia</h3>
                                    <div
                                        className={`border-2 border-dashed border-muted-foreground/40 rounded-lg bg-background flex flex-col items-center justify-center py-8 px-2 sm:px-8 mb-4 transition ${dragActive ? 'ring-2 ring-pink-400' : ''}`}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <Camera className="w-10 h-10 text-muted-foreground mb-2" />
                                            <div className="font-semibold text-base text-foreground">Arraste arquivos para cá</div>
                                            <div className="text-xs text-muted-foreground mb-2">Formatos aceitos: JPG, PNG, MP4, MOV, AVI, MPEG, WMV, WEBM, OGG, MKV, FLV, 3GP</div>
                                            <input 
                                                        type="url"
                                                        className="w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground outline-none transition placeholder:text-muted-foreground"
                                                        placeholder="https://meu-portfóli"
                                                    />
                                            
                                            <Button
                                                className="bg-[#E91E63] hover:bg-pink-600 text-white font-semibold px-6 py-2 rounded-md mt-2"
                                                onClick={() => mediaInputRef.current?.click()}
                                                disabled={getTotalMediaCount() >= MAX_TOTAL_FILES}
                                            >Adicionar Mídia</Button>
                                            <input
                                                ref={mediaInputRef}
                                                type="file"
                                                accept="image/png, image/jpeg, image/jpg, video/mp4, video/quicktime, video/mov, video/avi, video/mpeg, video/x-msvideo, video/webm, video/ogg, video/x-matroska, video/x-flv, video/3gpp, video/x-ms-wmv"
                                                className="hidden"
                                                multiple
                                                onChange={handleMediaChange}
                                                disabled={getTotalMediaCount() >= MAX_TOTAL_FILES}
                                            />
                                            <div className="text-xs text-muted-foreground mt-2">Máximo: 5 arquivos por vez, 12 itens no total</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold text-base mb-2">Meu Trabalho ({getTotalMediaCount()}/{MAX_TOTAL_FILES})</h3>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {/* Existing portfolio items */}
                                        {portfolio?.items?.map((item: any) => (
                                            <div key={`existing-${item.id}`} className="rounded-lg bg-background flex flex-col items-start justify-between aspect-[4/3] p-2 relative overflow-hidden group">
                                                <span className={`absolute top-2 left-2 text-white text-xs px-2 py-0.5 rounded-full ${item.media_type === 'image' ? 'bg-purple-500' : 'bg-blue-500'}`}>{item.media_type === 'image' ? 'Foto' : 'Vídeo'}</span>
                                                {item.media_type === 'image' ? (
                                                    <img
                                                        src={item.file_url || `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/storage/${item.file_path}`}
                                                        alt={item.title}
                                                        className="object-cover w-full h-full rounded-md cursor-pointer"
                                                        onClick={() => handleImageClick(item.file_url || `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/storage/${item.file_path}`)}
                                                        onError={(e) => {
                                                            console.error('Image failed to load:', item.file_url || item.file_path);
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center w-full h-full">
                                                        <VideoIcon />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button
                                                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition"
                                                        onClick={() => handleRemovePortfolioItem(item.id)}
                                                        aria-label="Remover mídia"
                                                    >
                                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {/* New media items */}
                                        {media.map((item, idx) => (
                                            <div key={`new-${idx}`} className="rounded-lg bg-background flex flex-col items-start justify-between aspect-[4/3] p-2 relative overflow-hidden group">
                                                <span className={`absolute top-2 left-2 text-white text-xs px-2 py-0.5 rounded-full ${item.type === 'image' ? 'bg-purple-500' : 'bg-blue-500'}`}>{item.type === 'image' ? 'Foto' : 'Vídeo'}</span>
                                                {item.type === 'image' ? (
                                                    <img
                                                        src={item.url}
                                                        alt="media"
                                                        className="object-cover w-full h-full rounded-md cursor-pointer"
                                                        onClick={() => handleImageClick(item.url)}
                                                    />
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center w-full h-full">
                                                        <VideoIcon />
                                                    </div>
                                                )}
                                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                                    <button
                                                        className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition"
                                                        onClick={() => handleRemoveMedia(idx)}
                                                        aria-label="Remover mídia"
                                                    >
                                                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {/* Add new media button if not at max */}
                                        {getTotalMediaCount() < MAX_TOTAL_FILES && (
                                            <button
                                                className="rounded-lg border-2 border-dashed border-muted-foreground/40 bg-background flex items-center justify-center aspect-[4/3] text-3xl text-muted-foreground hover:bg-muted/70 transition"
                                                onClick={() => mediaInputRef.current?.click()}
                                                type="button"
                                                aria-label="Adicionar mídia"
                                            >
                                                <Plus className="w-8 h-8" />
                                            </button>
                                        )}
                                    </div>
                                    {/* Tips */}
                                    <div className="flex flex-col sm:flex-row gap-2 mt-4 text-xs">
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Inclua pelo menos 3 trabalhos para se destacar!</div>
                                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Mostre variedade – vídeos curtos, fotos, reviews...</div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsPortfolioEditDialogOpen(false)}
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="bg-[#E91E63] hover:bg-pink-600 text-white"
                                    onClick={handleSavePortfolio}
                                    disabled={isSaving || media.length === 0}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Salvar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                {/* Media Grid */}
                <div>
                    <h3 className="font-semibold text-base mb-2">Meu Trabalho ({getTotalMediaCount()}/{MAX_TOTAL_FILES})</h3>
                    {getTotalMediaCount() === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Nenhum trabalho adicionado ainda</p>
                            <p className="text-sm">Clique em "Add Portfólio" para adicionar seus trabalhos</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {/* Existing portfolio items */}
                            {portfolio?.items?.map((item: any) => (
                                <div key={`existing-${item.id}`} className="rounded-lg bg-background flex flex-col items-start justify-between aspect-[4/3] p-2 relative overflow-hidden group">
                                    <span className={`absolute top-2 left-2 text-white text-xs px-2 py-0.5 rounded-full ${item.media_type === 'image' ? 'bg-purple-500' : 'bg-blue-500'}`}>{item.media_type === 'image' ? 'Foto' : 'Vídeo'}</span>
                                    {item.media_type === 'image' ? (
                                        <img
                                            src={item.file_url || `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/storage/${item.file_path}`}
                                            alt={item.title}
                                            className="object-cover w-full h-full rounded-md cursor-pointer"
                                            onClick={() => handleImageClick(item.file_url || `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/storage/${item.file_path}`)}
                                            onError={(e) => {
                                                console.error('Image failed to load:', item.file_url || item.file_path);
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <video
                                            src={item.file_url || `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/storage/${item.file_path}`}
                                            className="object-cover w-full h-full rounded-md cursor-pointer"
                                            controls
                                            preload="metadata"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVideoClick(item.file_url || `${import.meta.env.VITE_BACKEND_URL || 'https://nexacreators.com.br'}/storage/${item.file_path}`);
                                            }}
                                            onError={(e) => {
                                                console.error('Video failed to load:', item.file_url || item.file_path);
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = '<div class="flex flex-col items-center justify-center w-full h-full"><svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="mx-auto text-blue-500"><rect x="3" y="5" width="15" height="14" rx="2" fill="currentColor" opacity="0.1" /><rect x="3" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" /><path d="M21 7v10l-4-3.5V10.5L21 7z" fill="currentColor" /></svg></div>';
                                                }
                                            }}
                                        />
                                    )}
                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition"
                                            onClick={() => handleRemovePortfolioItem(item.id)}
                                            aria-label="Remover mídia"
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {/* New media items */}
                            {media.map((item, idx) => (
                                <div key={`new-${idx}`} className="rounded-lg bg-background flex flex-col items-start justify-between aspect-[4/3] p-2 relative overflow-hidden group">
                                    <span className={`absolute top-2 left-2 text-white text-xs px-2 py-0.5 rounded-full ${item.type === 'image' ? 'bg-purple-500' : 'bg-blue-500'}`}>{item.type === 'image' ? 'Foto' : 'Vídeo'}</span>
                                    {item.type === 'image' ? (
                                        <img
                                            src={item.url}
                                            key={`new-${idx}`}
                                            alt="media"
                                            className="object-cover w-full h-full rounded-md cursor-pointer"
                                            onClick={() => handleImageClick(item.url)}
                                        />
                                    ) : (
                                        <video
                                            src={item.url}
                                            className="object-cover w-full h-full rounded-md cursor-pointer"
                                            controls
                                            preload="metadata"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleVideoClick(item.url);
                                            }}
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const parent = e.currentTarget.parentElement;
                                                if (parent) {
                                                    parent.innerHTML = '<div class="flex flex-col items-center justify-center w-full h-full"><svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="mx-auto text-blue-500"><rect x="3" y="5" width="15" height="14" rx="2" fill="currentColor" strokeWidth="2" /><path d="M21 7v10l-4-3.5V10.5L21 7z" fill="currentColor" /></svg></div>';
                                                }
                                            }}
                                        />
                                    )}
                                    <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                        <button
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow transition"
                                            onClick={() => handleRemoveMedia(idx)}
                                            aria-label="Remover mídia"
                                        >
                                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    {/* Tips */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4 text-xs">
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Inclua pelo menos 3 trabalhos para se destacar!</div>
                        <div className="flex items-center gap-1 text-green-600 dark:text-green-400"><svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Mostre variedade – vídeos curtos, fotos, reviews...</div>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            {/* <div className="flex justify-end mt-6">
                <Button
                    className="bg-[#E91E63] hover:bg-pink-600 text-white font-semibold px-8 py-2 rounded-md text-base"
                    onClick={handleSavePortfolioComplete}
                    disabled={isSaving}
                >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Salvar Portfólio
                </Button>
            </div> */}

            {/* Image Modal */}
            {isImageModalOpen && selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleCloseImageModal}>
                    <div className="relative max-w-full max-h-full p-4">
                        <img
                            src={selectedImage}
                            alt="Portfolio Image"
                            className="max-w-full max-h-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button
                            onClick={handleCloseImageModal}
                            className="absolute top-2 right-2 text-white text-4xl hover:text-gray-300 transition-colors"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}

            {/* Video Modal */}
            {isVideoModalOpen && selectedVideo && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={handleCloseVideoModal}>
                    <div className="relative max-w-4xl max-h-full p-4">
                        <video
                            src={selectedVideo}
                            className="max-w-full max-h-full object-contain"
                            controls
                            autoPlay
                            onClick={(e) => e.stopPropagation()}
                            onError={(e) => {
                                console.error('Video modal failed to load:', selectedVideo);
                            }}
                        />
                        <button
                            onClick={handleCloseVideoModal}
                            className="absolute top-2 right-2 text-white text-4xl hover:text-gray-300 transition-colors"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function VideoIcon() {
    return (
        <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="mx-auto text-blue-500">
            <rect x="3" y="5" width="15" height="14" rx="2" fill="currentColor" opacity="0.1" />
            <rect x="3" y="5" width="15" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
            <path d="M21 7v10l-4-3.5V10.5L21 7z" fill="currentColor" />
        </svg>
    );
}
