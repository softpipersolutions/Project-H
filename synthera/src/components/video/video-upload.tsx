'use client'

import { useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  Film, 
  X, 
  Play, 
  Loader2, 
  AlertCircle,
  DollarSign,
  Tag,
  Sparkles
} from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { formatFileSize } from '@/lib/utils'
import { useUploadStore } from '@/store'

interface UploadFormData {
  title: string
  description: string
  aiModel: string
  prompts: string[]
  tags: string[]
  category: string
  style: string
  personalLicense: number
  commercialLicense: number
  extendedLicense: number
}

const AI_MODELS = [
  'Runway Gen-3',
  'Runway Gen-2',
  'Pika Labs',
  'Stable Video Diffusion',
  'LumaLabs Dream Machine',
  'Synthesia',
  'D-ID',
  'Custom Model',
  'Other'
]

const VIDEO_CATEGORIES = [
  { value: 'CINEMATIC', label: 'Cinematic' },
  { value: 'ABSTRACT', label: 'Abstract' },
  { value: 'PHOTOREALISTIC', label: 'Photorealistic' },
  { value: 'ANIMATION', label: 'Animation' },
  { value: 'MOTION_GRAPHICS', label: 'Motion Graphics' },
  { value: 'EXPERIMENTAL', label: 'Experimental' },
  { value: 'NATURE', label: 'Nature' },
  { value: 'ARCHITECTURE', label: 'Architecture' },
  { value: 'FASHION', label: 'Fashion' },
  { value: 'TECHNOLOGY', label: 'Technology' },
]

const VIDEO_STYLES = [
  { value: 'CINEMATIC', label: 'Cinematic' },
  { value: 'MINIMALIST', label: 'Minimalist' },
  { value: 'SURREAL', label: 'Surreal' },
  { value: 'RETRO', label: 'Retro' },
  { value: 'FUTURISTIC', label: 'Futuristic' },
  { value: 'ARTISTIC', label: 'Artistic' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'DOCUMENTARY', label: 'Documentary' },
]

export function VideoUpload() {
  const { data: session } = useSession()
  const router = useRouter()
  const { addUpload, updateUpload, removeUpload } = useUploadStore()

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [formData, setFormData] = useState<UploadFormData>({
    title: '',
    description: '',
    aiModel: '',
    prompts: [],
    tags: [],
    category: '',
    style: '',
    personalLicense: 0,
    commercialLicense: 0,
    extendedLicense: 0,
  })
  const [newPrompt, setNewPrompt] = useState('')
  const [newTag, setNewTag] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const uploadId = `upload-${Date.now()}`
      addUpload(uploadId)

      // Simulate upload progress (in real implementation, you'd track actual progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 10, 90)
          updateUpload(uploadId, newProgress, 'uploading')
          return newProgress
        })
      }, 500)

      try {
        const response = await fetch('/api/videos/upload', {
          method: 'POST',
          body: data,
        })

        clearInterval(progressInterval)

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const result = await response.json()
        
        updateUpload(uploadId, 100, 'complete')
        removeUpload(uploadId)
        
        return result
      } catch (error) {
        clearInterval(progressInterval)
        updateUpload(uploadId, uploadProgress, 'error', (error as Error).message)
        throw error
      }
    },
    onSuccess: (data) => {
      router.push(`/video/${data.video.id}`)
    },
  })

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      // Auto-fill title from filename
      if (!formData.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
        setFormData(prev => ({ ...prev, title: nameWithoutExt }))
      }
    }
  }, [formData.title])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.webm', '.mkv']
    },
    maxFiles: 1,
    maxSize: 100 * 1024 * 1024, // 100MB
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      alert('Please select a video file')
      return
    }

    if (!session?.user) {
      alert('Please sign in to upload videos')
      return
    }

    const data = new FormData()
    data.append('video', selectedFile)
    data.append('title', formData.title)
    data.append('description', formData.description)
    data.append('aiModel', formData.aiModel)
    data.append('prompts', JSON.stringify(formData.prompts))
    data.append('tags', JSON.stringify(formData.tags))
    data.append('category', formData.category)
    data.append('style', formData.style)
    data.append('personalLicense', formData.personalLicense.toString())
    data.append('commercialLicense', formData.commercialLicense.toString())
    data.append('extendedLicense', formData.extendedLicense.toString())

    setUploadProgress(0)
    uploadMutation.mutate(data)
  }

  const addPrompt = () => {
    if (newPrompt.trim() && !formData.prompts.includes(newPrompt.trim())) {
      setFormData(prev => ({
        ...prev,
        prompts: [...prev.prompts, newPrompt.trim()]
      }))
      setNewPrompt('')
    }
  }

  const removePrompt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      prompts: prev.prompts.filter((_, i) => i !== index)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  if (session?.user?.type === 'BROWSER') {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <AlertCircle className="w-6 h-6 text-orange-500" />
            <span>Creator Access Required</span>
          </CardTitle>
          <CardDescription>
            You need to be a creator to upload videos. Please upgrade your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button onClick={() => router.push('/upgrade')}>
            Become a Creator
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Upload Your AI Video</h1>
        <p className="text-muted-foreground">
          Share your AI-generated video with the Synthera community
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Select Video File</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedFile ? (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Film className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Drop your video here' : 'Drag & drop your video'}
                </p>
                <p className="text-muted-foreground mb-4">
                  or click to browse files
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports MP4, MOV, AVI, WebM, MKV • Max 100MB
                </p>
              </div>
            ) : (
              <div className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center">
                  <Play className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{selectedFile.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Video Details */}
        <Card>
          <CardHeader>
            <CardTitle>Video Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description *</label>
              <textarea
                className="w-full p-3 border border-input rounded-md bg-transparent"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe your video and the AI generation process"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">AI Model *</label>
                <select
                  className="w-full p-3 border border-input rounded-md bg-background"
                  value={formData.aiModel}
                  onChange={(e) => setFormData(prev => ({ ...prev, aiModel: e.target.value }))}
                  required
                >
                  <option value="">Select AI Model</option>
                  {AI_MODELS.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  className="w-full p-3 border border-input rounded-md bg-background"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  required
                >
                  <option value="">Select Category</option>
                  {VIDEO_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Style *</label>
              <select
                className="w-full p-3 border border-input rounded-md bg-background"
                value={formData.style}
                onChange={(e) => setFormData(prev => ({ ...prev, style: e.target.value }))}
                required
              >
                <option value="">Select Style</option>
                {VIDEO_STYLES.map(style => (
                  <option key={style.value} value={style.value}>{style.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Prompts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5" />
              <span>AI Prompts</span>
            </CardTitle>
            <CardDescription>
              Add the prompts you used to generate this video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Enter prompt"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPrompt())}
              />
              <Button type="button" onClick={addPrompt}>
                Add
              </Button>
            </div>
            
            {formData.prompts.length > 0 && (
              <div className="space-y-2">
                {formData.prompts.map((prompt, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Badge variant="secondary" className="flex-1 justify-between">
                      <span>{prompt}</span>
                      <button
                        type="button"
                        onClick={() => removePrompt(index)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="w-5 h-5" />
              <span>Tags</span>
            </CardTitle>
            <CardDescription>
              Add tags to help users discover your video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter tag"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag}>
                Add
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Licensing & Pricing</span>
            </CardTitle>
            <CardDescription>
              Set prices for different license types (leave 0 for free)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Personal License</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.personalLicense}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    personalLicense: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For personal use only
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Commercial License</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.commercialLicense}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    commercialLicense: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  For commercial projects
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Extended License</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.extendedLicense}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    extendedLicense: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unlimited commercial use
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {uploadMutation.isPending && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <div className="flex-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Uploading video...</span>
                    <span className="text-sm text-muted-foreground">{uploadProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={uploadMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedFile || uploadMutation.isPending}
            className="min-w-[120px]"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </div>

        {uploadMutation.isError && (
          <Card className="border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Upload Failed</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {uploadMutation.error?.message || 'An error occurred during upload'}
              </p>
            </CardContent>
          </Card>
        )}
      </form>
    </div>
  )
}