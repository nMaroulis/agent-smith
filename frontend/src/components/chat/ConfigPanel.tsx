import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { SelectChangeEvent } from '@mui/material/Select';
import { 
  fetchRemoteLLMs, 
  fetchLocalLLMs, 
  fetchRemoteModels, 
  fetchLocalModels, 
  fetchModelParameters
} from '../../api/chatbot';

import { 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider, 
  FormControl, 
  FormControlLabel, 
  InputLabel, 
  MenuItem, 
  Select, 
  Slider, 
  Stack,
  Switch, 
  TextField, 
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SpeedIcon from '@mui/icons-material/Speed';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

interface ConfigPanelProps {
  config: ModelConfig;
  onConfigChange: (config: Partial<ModelConfig>) => void;
  onClearChat: () => void;
}

interface LLM {
  alias: string;
  provider: string;
}

interface ModelConfig {
  llmType: 'remote' | 'local';
  llmAlias: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  streaming: boolean;
  aiAgent: boolean;
  provider?: string; // For backward compatibility
}

interface ParameterConfig {
  type: string;
  min: number;
  max: number;
  default: number;
}

export const ConfigPanel = ({ config, onConfigChange, onClearChat }: ConfigPanelProps) => {
  const [promptModalOpen, setPromptModalOpen] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  
  const handleOpenPromptModal = () => {
    setEditedPrompt(config.systemPrompt);
    setPromptModalOpen(true);
  };
  
  const handleSavePrompt = () => {
    const updatedConfig = { ...localConfig, systemPrompt: editedPrompt };
    setLocalConfig(updatedConfig);
    onConfigChange({ systemPrompt: editedPrompt });
    setPromptModalOpen(false);
  };

  // Use the config from props
  const [localConfig, setLocalConfig] = useState<ModelConfig>(config);
  
  // Update local config when prop changes
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const [parameters, setParameters] = useState<Record<string, ParameterConfig | null>>({});
  const queryClient = useQueryClient();

  // Fetch LLMs based on selected type (remote/local)
  const { data: remoteLLMs = [], isLoading: isLoadingRemoteLLMs } = useQuery<LLM[]>({
    queryKey: ['remoteLLMs'],
    queryFn: fetchRemoteLLMs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: localConfig.llmType === 'remote',
  });

  const { data: localLLMs = [], isLoading: isLoadingLocalLLMs } = useQuery<LLM[]>({
    queryKey: ['localLLMs'],
    queryFn: fetchLocalLLMs,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: localConfig.llmType === 'local',
  });

  const isLoadingLLMs = localConfig.llmType === 'remote' ? isLoadingRemoteLLMs : isLoadingLocalLLMs;

  // Fetch models based on selected LLM type and alias
  const { data: models = [], isLoading: loadingModels } = useQuery<string[]>({
    queryKey: ['models', localConfig.llmType, localConfig.llmAlias],
    queryFn: async () => {
      if (!localConfig.llmAlias) return [];
      try {
        const models = localConfig.llmType === 'remote' 
          ? await fetchRemoteModels(localConfig.llmAlias)
          : await fetchLocalModels(localConfig.llmAlias);
        // Ensure we always return an array, even if the API returns something else
        return Array.isArray(models) ? models : [];
      } catch (error) {
        console.error('Error fetching models:', error);
        return [];
      }
    },
    enabled: !!localConfig.llmAlias,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1
  });

  useEffect(() => {
    if (localConfig.model && localConfig.llmAlias) {
      fetchModelParameters(localConfig.llmType, localConfig.llmAlias)
        .then(setParameters)
        .catch(console.error);
    }
  }, [localConfig.model, localConfig.llmType, localConfig.llmAlias]);

  const handleLLMTypeChange = (event: SelectChangeEvent) => {
    const newLLMType = event.target.value as 'remote' | 'local';
    const llms = newLLMType === 'remote' ? remoteLLMs : localLLMs;
    const newLLMAlias = llms.length > 0 ? llms[0].alias : '';
    
    setLocalConfig(prev => ({
      ...prev,
      llmType: newLLMType,
      llmAlias: newLLMAlias
    }));
    
    onConfigChange({
      llmType: newLLMType,
      llmAlias: newLLMAlias,
      model: '' // Reset model when LLM type changes
    });
  };

  const handleLLMAliasChange = (event: SelectChangeEvent<string>) => {
    const llmAlias = event.target.value;
    setLocalConfig(prev => ({
      ...prev,
      llmAlias,
      model: ''
    }));
    onConfigChange({
      llmAlias,
      model: ''
    });
  };

  const handleModelChange = (event: SelectChangeEvent<string>) => {
    const model = event.target.value;
    setLocalConfig(prev => ({
      ...prev,
      model
    }));
    onConfigChange({ model });
  };



  // Type-safe parameter accessor
  const getParameterValue = (paramName: string): number => {
    const paramMap: Record<string, number> = {
      'temperature': localConfig.temperature,
      'topP': localConfig.topP,
      'frequencyPenalty': localConfig.frequencyPenalty,
      'presencePenalty': localConfig.presencePenalty,
      'maxTokens': localConfig.maxTokens
    };
    return paramMap[paramName] ?? 0;
  };



  const handleAiAgentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const aiAgent = event.target.checked;
    const update = { aiAgent };
    setLocalConfig(prev => ({
      ...prev,
      ...update
    }));
    onConfigChange(update);
  };

  // Only update when config properties change
  useEffect(() => {
    const { 
      provider, model, temperature, maxTokens, 
      topP, frequencyPenalty, presencePenalty, 
      streaming, systemPrompt 
    } = config;
    
    onConfigChange({
      provider,
      model,
      temperature,
      maxTokens,
      topP,
      frequencyPenalty,
      presencePenalty,
      streaming,
      systemPrompt
    });
  }, [
    config.provider, 
    config.model, 
    config.temperature, 
    config.maxTokens,
    config.topP, 
    config.frequencyPenalty, 
    config.presencePenalty,
    config.streaming, 
    config.systemPrompt,
    onConfigChange
  ]);

  return (
    <Card sx={{ 
      width: '100%', 
      mb: 0, 
      height: 'calc(100vh - 32px)', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: '#111827', // bg-gray-900
      color: 'white',
      boxShadow: 'none',
      borderRight: '1px solid',
      borderColor: '#1f2937', // border-gray-800
      '& .MuiCardHeader-root': {
        borderBottom: '1px solid #1f2937', // border-gray-800
        backgroundColor: '#111827', // bg-gray-900
        color: 'white'
      },
      '& .MuiCardContent-root': {
        backgroundColor: '#111827', // bg-gray-800
        color: 'white',
        '& .MuiTypography-root': {
          color: 'rgba(255, 255, 255, 0.87)'
        },
        '& .MuiInputBase-root': {
          backgroundColor: '#1f2937', // bg-gray-800
          color: 'white',
          '& fieldset': {
            borderColor: '#374151' // border-gray-700
          },
          '&:hover fieldset': {
            borderColor: '#4b5563' // border-gray-600
          },
          '&.Mui-focused fieldset': {
            borderColor: '#3b82f6' // border-blue-500
          }
        },
        '& .MuiSlider-root': {
          color: '#3b82f6' // text-blue-500
        },
        '& .MuiSwitch-switchBase': {
          color: '#6b7280', // text-gray-500
          '&.Mui-checked': {
            color: '#3b82f6', // text-blue-500
            '& + .MuiSwitch-track': {
              backgroundColor: '#3b82f6' // bg-blue-500
            }
          }
        },
        '& .MuiSwitch-track': {
          backgroundColor: '#6b7280' // bg-gray-500
        }
      }
    }}>
      <CardHeader title="Chat Configuration" />
      <CardContent sx={{ flex: 1, overflowY: 'auto', p: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pb: 2 }}>
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="subtitle2" gutterBottom>LLM Type</Typography>
            <ToggleButtonGroup
              color="primary"
              value={config.llmType}
              exclusive
              onChange={(_, newType) => {
                if (newType) {
                  handleLLMTypeChange({ target: { value: newType } } as SelectChangeEvent<string>);
                }
              }}
              fullWidth
              sx={{
                '& .MuiToggleButtonGroup-grouped': {
                  border: '1px solid #374151',
                  color: '#9ca3af',
                  '&.Mui-selected': {
                    backgroundColor: '#1e40af',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1e40af',
                    }
                  },
                  '&:not(:first-of-type)': {
                    borderLeft: '1px solid #374151',
                    marginLeft: 0,
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                  },
                  '&:first-of-type': {
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  },
                  '&:hover': {
                    backgroundColor: '#1f2937',
                  },
                }
              }}
            >
              <ToggleButton value="remote" aria-label="remote">
                <Box display="flex" alignItems="center" gap={1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                  </svg>
                  Remote
                </Box>
              </ToggleButton>
              <ToggleButton value="local" aria-label="local">
                <Box display="flex" alignItems="center" gap={1}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
                  </svg>
                  Local
                </Box>
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <FormControl fullWidth margin="normal">
            <InputLabel id="llm-alias-select-label">LLM Alias</InputLabel>
            <Select
              labelId="llm-alias-select-label"
              id="llm-alias-select"
              value={config.llmAlias}
              label="LLM Alias"
              onChange={handleLLMAliasChange}
              disabled={!config.llmType || isLoadingLLMs}
            >
              {(config.llmType === 'remote' ? remoteLLMs : localLLMs)?.map((llm: { alias: string; provider: string }) => (
                <MenuItem key={llm.alias} value={llm.alias}>
                  {llm.alias} ({llm.provider})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {config.llmAlias && (
            <FormControl fullWidth margin="normal">
              <InputLabel id="model-select-label">Model</InputLabel>
              <Select
                labelId="model-select-label"
                id="model-select"
                value={config.model}
                label="Model"
                onChange={handleModelChange}
                disabled={!config.llmAlias || loadingModels}
                displayEmpty
                renderValue={(selected) => {
                  if (!selected) {
                    return <em>Select a model</em>;
                  }
                  return selected;
                }}
              >
                {loadingModels ? (
                  <MenuItem disabled>Loading models...</MenuItem>
                ) : models.length === 0 ? (
                  <MenuItem disabled>No models available</MenuItem>
                ) : (
                  models.map((model: string) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          )}

          <Divider sx={{ my: 0, borderColor: '#374151' /* gray-700 */ }} />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              System Prompt
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleOpenPromptModal}
              startIcon={<EditIcon />}
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                color: '#e5e7eb',
                borderColor: '#374151',
                '&:hover': {
                  borderColor: '#4b5563',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)'
                }
              }}
            >
              {config.systemPrompt || 'Click to edit system prompt...'}
            </Button>
            
            <Dialog 
              open={promptModalOpen} 
              onClose={() => setPromptModalOpen(false)}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  bgcolor: '#1f2937',
                  color: 'white',
                  minHeight: '50vh',
                  maxHeight: '80vh',
                  '& .MuiDialogTitle-root': {
                    borderBottom: '1px solid #374151',
                    padding: '16px 24px'
                  },
                  '& .MuiDialogContent-root': {
                    padding: '20px 24px'
                  },
                  '& .MuiDialogActions-root': {
                    padding: '16px 24px',
                    borderTop: '1px solid #374151'
                  }
                }
              }}
            >
              <DialogTitle>Edit System Prompt</DialogTitle>
              <DialogContent>
                <TextField
                  fullWidth
                  multiline
                  minRows={10}
                  maxRows={20}
                  value={editedPrompt}
                  onChange={(e) => setEditedPrompt(e.target.value)}
                  placeholder="Enter system prompt..."
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: 'white',
                      '& fieldset': {
                        borderColor: '#4b5563',
                      },
                      '&:hover fieldset': {
                        borderColor: '#6b7280',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#3b82f6',
                      },
                    },
                    '& .MuiInputBase-input': {
                      color: 'white',
                    },
                  }}
                />
              </DialogContent>
              <DialogActions>
                <Button 
                  onClick={() => setPromptModalOpen(false)}
                  sx={{ color: '#9ca3af' }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSavePrompt}
                  variant="contained"
                  sx={{
                    bgcolor: '#1e40af',
                    '&:hover': {
                      bgcolor: '#1e3a8a',
                    },
                  }}
                >
                  Save
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
          
          <Divider sx={{ my: 0, borderColor: '#374151' /* gray-700 */ }} />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.streaming}
                  onChange={(e) => {
                    const streaming = e.target.checked;
                    setLocalConfig(prev => ({ ...prev, streaming }));
                    onConfigChange({ streaming });
                  }}
                />
              }
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  <SpeedIcon sx={{ color: 'primary.main' }} />
                  <Typography>Streaming</Typography>
                </Stack>
              }
            />
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.aiAgent}
                  onChange={handleAiAgentChange}
                  disabled={true}
                />
              }
              label={
                <Stack direction="row" alignItems="center" gap={1}>
                  <SmartToyIcon sx={{ color: 'success.main' }} />
                  <Typography>AI Agent (Coming soon)</Typography>
                </Stack>
              }
            />
          </Box>
          <Divider sx={{ my: 0, borderColor: '#374151' /* gray-700 */ }} />

          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Model Parameters</Typography>
            {config.model ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {Object.entries(parameters).map(([paramName, param]) => {
                  if (!param) return null;
                  return (
                    <Box key={paramName}>
                      <Typography variant="body2" sx={{ mb: 1 }}>{paramName}</Typography>
                      <Slider
                        value={getParameterValue(paramName)}
                        min={param.min}
                        max={param.max}
                        step={0.1}
                        onChange={(_, value) => {
                          const numValue = Array.isArray(value) ? value[0] : value;
                          const update = { [paramName]: numValue } as Partial<ModelConfig>;
                          setLocalConfig(prev => ({
                            ...prev,
                            ...update
                          }));
                          onConfigChange(update);
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        {getParameterValue(paramName)} ({param.min} - {param.max})
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2, color: 'text.secondary' }}>
                Select a model to configure its parameters
              </Typography>
            )}
          </Box>
          
          <Divider sx={{ my: 0, borderColor: '#374151' }} />
          
          <Box sx={{ mt: 2 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={onClearChat}
              startIcon={<DeleteOutlineIcon />}
              sx={{
                color: '#ef4444',
                borderColor: '#ef4444',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  borderColor: '#dc2626',
                },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
                py: 1.5
              }}
            >
              Clear Chat
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};