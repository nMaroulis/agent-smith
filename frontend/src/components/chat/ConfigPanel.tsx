import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Divider, Typography, Box, Slider, Switch, FormControlLabel, TextField, Select, MenuItem, Button, CircularProgress, ToggleButtonGroup, ToggleButton } from '@mui/material';
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
    onConfigChange(config);
  }, [config, onConfigChange]);

  return (
    <Card sx={{ width: '100%', mb: 4 }}>
      <CardHeader title="Chat Configuration" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
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
                  minWidth: '50%'
                }
              }}
            >
              <ToggleButton value="remote" sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white'
                }
              }}>
                Remote LLM
              </ToggleButton>
              <ToggleButton value="local" sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.main',
                  color: 'white'
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

          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Parameters
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {Object.entries(parameters).map(([paramName, paramConfig]) => {
                if (!paramConfig) return null;

                const { type, min, max, default: defaultValue } = paramConfig;
                const currentValue = config[paramName as keyof typeof config] || defaultValue;

                return (
                  <Box key={paramName} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2">{paramName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Typography>
                    <Slider
                      value={currentValue}
                      onChange={handleParameterChange(paramName)}
                      min={min}
                      max={max}
                      step={type === 'float' ? 0.1 : 1}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                );
              })}
            </Box>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.streaming}
                  onChange={handleStreamingChange}
                />
              }
              label="Streaming"
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
              label="AI Agent (Coming soon)"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};