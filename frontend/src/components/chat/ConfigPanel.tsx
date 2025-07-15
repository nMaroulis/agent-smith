import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  Typography, 
  Box, 
  Slider, 
  Switch, 
  FormControlLabel, 
  TextField, 
  Select, 
  MenuItem, 
  Button, 
  CircularProgress, 
  ToggleButtonGroup, 
  ToggleButton, 
  Stack
} from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRemoteLLMs, fetchLocalLLMs, fetchRemoteModels, fetchLocalModels, fetchModelParameters } from '../../api/llms';

interface ConfigPanelProps {
  onConfigChange: (config: any) => void;
}

interface ModelConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  streaming: boolean;
  systemPrompt: string;
}

interface ParameterConfig {
  type: string;
  min: number;
  max: number;
  default: number;
}

export const ConfigPanel = ({ onConfigChange }: ConfigPanelProps) => {
  const [config, setConfig] = useState<ModelConfig>({
    provider: '',
    remoteAlias: '',
    localAlias: '',
    model: '',
    systemPrompt: 'You are a helpful AI assistant.',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    streaming: true,
    aiAgent: false
  });

  const [parameters, setParameters] = useState<Record<string, ParameterConfig | null>>({});
  const queryClient = useQueryClient();

  const { data: remoteLLMs, isLoading: loadingRemoteLLMs } = useQuery({
    queryKey: ['remoteLLMs'],
    queryFn: fetchRemoteLLMs,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const { data: localLLMs, isLoading: loadingLocalLLMs } = useQuery({
    queryKey: ['localLLMs'],
    queryFn: fetchLocalLLMs,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const selectedProvider = config.provider;

  const { data: remoteModels, isLoading: loadingRemoteModels } = useQuery({
    queryKey: ['remoteModels', config.remoteAlias],
    queryFn: () => config.remoteAlias ? fetchRemoteModels(config.remoteAlias) : [],
    enabled: !!config.remoteAlias,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  const { data: localModels, isLoading: loadingLocalModels } = useQuery({
    queryKey: ['localModels', config.localAlias],
    queryFn: () => config.localAlias ? fetchLocalModels(config.localAlias) : [],
    enabled: !!config.localAlias,
    staleTime: 1000 * 60 * 5 // 5 minutes
  });

  useEffect(() => {
    if (config.model && (config.remoteAlias || config.localAlias)) {
      const provider = config.provider === 'remote' ? 'remote' : 'local';
      const alias = config.provider === 'remote' ? config.remoteAlias : config.localAlias;
      fetchModelParameters(provider, alias)
        .then(setParameters)
        .catch(console.error);
    }
  }, [config.model, config.provider, config.remoteAlias, config.localAlias]);

  const handleProviderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newProvider = event.target.value as 'remote' | 'local';
    setConfig(prev => ({
      ...prev,
      provider: newProvider,
      remoteAlias: newProvider === 'remote' ? '' : prev.remoteAlias,
      localAlias: newProvider === 'local' ? '' : prev.localAlias,
      model: ''
    }));
  };

  const handleRemoteAliasChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      remoteAlias: event.target.value,
      model: ''
    }));
  };

  const handleLocalAliasChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      localAlias: event.target.value,
      model: ''
    }));
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      model: event.target.value
    }));
  };

  const handleSystemPromptChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      systemPrompt: event.target.value
    }));
  };

  const handleParameterChange = (parameter: string) => (_: Event, newValue: number | number[]) => {
    setConfig(prev => ({
      ...prev,
      [parameter]: newValue as number
    }));
  };

  const handleStreamingChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      streaming: event.target.checked
    }));
  };

  const handleAiAgentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setConfig(prev => ({
      ...prev,
      aiAgent: event.target.checked
    }));
  };

  useEffect(() => {
    onConfigChange({
      provider: config.provider,
      model: config.model,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      topP: config.topP,
      frequencyPenalty: config.frequencyPenalty,
      presencePenalty: config.presencePenalty,
      streaming: config.streaming,
      systemPrompt: config.systemPrompt
    });
  }, [config, onConfigChange]);

  return (
    <Card sx={{ 
      width: '100%', 
      mb: 4, 
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
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Provider
            </Typography>
            <ToggleButtonGroup
              value={config.provider}
              exclusive
              onChange={(_, value) => handleProviderChange({ target: { value } } as any)}
              fullWidth
              disabled={loadingRemoteLLMs || loadingLocalLLMs}
              sx={{
                '& .MuiToggleButton-root': {
                  textTransform: 'none',
                  borderRadius: 1,
                  minWidth: '50%',
                  color: '#9ca3af', // text-gray-400
                  borderColor: '#374151', // border-gray-700
                  backgroundColor: '#1f2937', // bg-gray-800
                  '&.Mui-selected': {
                    backgroundColor: '#1e40af', // bg-blue-900
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#1e40af' // bg-blue-900
                    }
                  },
                  '&:hover': {
                    backgroundColor: '#1f2937', // bg-gray-800
                    color: 'white'
                  }
                }
              }}
            >
              <ToggleButton value="remote" sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  color: 'text.primary'
                }
              }}>
                Remote LLM
              </ToggleButton>
              <ToggleButton value="local" sx={{
                '&.Mui-selected': {
                  backgroundColor: 'action.selected',
                  color: 'text.primary'
                }
              }}>
                Local LLM
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {selectedProvider === 'remote' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Remote LLM
              </Typography>
              <Select
                value={config.remoteAlias}
                onChange={handleRemoteAliasChange}
                fullWidth
                disabled={loadingRemoteLLMs || !remoteLLMs}
              >
                {remoteLLMs?.map((llm) => (
                  <MenuItem key={llm.alias} value={llm.alias}>
                    {llm.alias} ({llm.provider})
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          {selectedProvider === 'local' && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Local LLM
              </Typography>
              <Select
                value={config.localAlias}
                onChange={handleLocalAliasChange}
                fullWidth
                disabled={loadingLocalLLMs || !localLLMs}
              >
                {localLLMs?.map((llm) => (
                  <MenuItem key={llm.alias} value={llm.alias}>
                    {llm.alias} ({llm.provider})
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          {(config.remoteAlias || config.localAlias) && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Model
              </Typography>
              <Select
                value={config.model}
                onChange={handleModelChange}
                fullWidth
                disabled={loadingRemoteModels || loadingLocalModels}
              >
                {selectedProvider === 'remote' ? (
                  remoteModels?.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))
                ) : localModels?.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          )}

          <Divider sx={{ my: 0, borderColor: '#374151' /* gray-700 */ }} />

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              System Prompt
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={config.systemPrompt}
              onChange={handleSystemPromptChange}
              placeholder="Enter system prompt..."
            />
          </Box>
          
          <Divider sx={{ my: 0, borderColor: '#374151' /* gray-700 */ }} />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.streaming}
                  onChange={(e) => {
                    setConfig(prev => ({ ...prev, streaming: e.target.checked }));
                    onConfigChange({
                      ...config,
                      streaming: e.target.checked
                    });
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
                        value={config[paramName]}
                        min={param.min}
                        max={param.max}
                        step={0.1}
                        onChange={(_, value) => {
                          setConfig(prev => ({ ...prev, [paramName]: value }));
                          onConfigChange({
                            ...config,
                            [paramName]: value
                          });
                        }}
                      />
                      <Typography variant="caption" sx={{ mt: 1 }}>
                        {config[paramName]} ({param.min} - {param.max})
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

        </Box>
      </CardContent>
    </Card>
  );
};