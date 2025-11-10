import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { templateApi } from '../services/api'
import { Settings, Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Skeleton } from '../components/Skeleton'

export const TemplatesPage: React.FC = () => {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    jsonDefinition: ''
  })

  const isAdmin = user?.role === 'Admin'

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    try {
      const templatesData = await templateApi.getAll()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Failed to fetch templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await templateApi.create(formData)
      setFormData({ name: '', jsonDefinition: '' })
      setShowCreateForm(false)
      await fetchTemplates()
    } catch (error) {
      console.error('Failed to create template:', error)
      alert('Failed to create template')
    }
  }

  const handleUpdateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingTemplate) return

    try {
      await templateApi.update(editingTemplate.id, {
        ...formData,
        isActive: editingTemplate.isActive
      })
      setEditingTemplate(null)
      setFormData({ name: '', jsonDefinition: '' })
      await fetchTemplates()
    } catch (error) {
      console.error('Failed to update template:', error)
      alert('Failed to update template')
    }
  }

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      await templateApi.delete(templateId)
      await fetchTemplates()
    } catch (error) {
      console.error('Failed to delete template:', error)
      alert('Failed to delete template')
    }
  }

  const handleEditTemplate = (template: any) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      jsonDefinition: template.jsonDefinition
    })
  }

  const handleCancelEdit = () => {
    setEditingTemplate(null)
    setFormData({ name: '', jsonDefinition: '' })
  }

  const formatJson = (jsonString: string) => {
    try {
      return JSON.stringify(JSON.parse(jsonString), null, 2)
    } catch {
      return jsonString
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage PDF transformation templates and rules.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingTemplate) && isAdmin && (
        <div className="card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {editingTemplate ? 'Edit Template' : 'Create New Template'}
          </h2>
          
          <form onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="input-field"
                placeholder="Enter template name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                JSON Definition
              </label>
              <textarea
                value={formData.jsonDefinition}
                onChange={(e) => setFormData(prev => ({ ...prev, jsonDefinition: e.target.value }))}
                className="input-field h-32 resize-none"
                placeholder='{"header": "Document Header", "fields": ["field1", "field2"]}'
                required
              />
            </div>

            <div className="flex space-x-3">
              <button type="submit" className="btn-primary">
                {editingTemplate ? 'Update Template' : 'Create Template'}
              </button>
              <button
                type="button"
                onClick={editingTemplate ? handleCancelEdit : () => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Available Templates</h2>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="space-y-3">
              <Skeleton variant="text" width="60%" height={20} className="mx-auto" />
              <Skeleton count={3} />
            </div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
            <p className="mt-1 text-sm text-gray-500">
              {isAdmin ? 'Create your first template to get started.' : 'No templates available.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900">{template.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        const json = formatJson(template.jsonDefinition)
                        navigator.clipboard.writeText(json)
                        alert('JSON copied to clipboard')
                      }}
                      className="text-gray-400 hover:text-gray-600"
                      title="Copy JSON"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="mt-3">
                  <details className="group">
                    <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                      View JSON Definition
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
                      {formatJson(template.jsonDefinition)}
                    </pre>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
