import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, Divider, Typography, Box, Slider, Switch, FormControlLabel, TextField, Select, MenuItem, Button, CircularProgress } from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchRemoteLLMs, fetchLocalLLMs, fetchRemoteModels, fetchLocalModels } from '../../api/llms';

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

export const ConfigPanel = ({ onConfigChange }: ConfigPanelProps) => {
  const [config, setConfig] = useState<ModelConfig>({
    provider: '',
    model: '',
    temperature: 0.7,
    maxTokens: 1000,
    topP: 1.0,
    frequencyPenalty: 0.0,
    presencePenalty: 0.0,
    streaming: true,
    systemPrompt: 'You are a helpful AI assistant.',
  });

  const queryClient = useQueryClient();

  const { data: remoteLLMs, isLoading: loadingRemoteLLMs } = useQuery({
    queryKey: ['remoteLLMs'],
    queryFn: fetchRemoteLLMs,
  });

  const { data: localLLMs, isLoading: loadingLocalLLMs } = useQuery({
    queryKey: ['localLLMs'],
    queryFn: fetchLocalLLMs,
  });

  const [selectedProvider, setSelectedProvider] = useState('');
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (selectedProvider) {
      setLoadingModels(true);
      if (selectedProvider.startsWith('remote_')) {
        fetchRemoteModels(selectedProvider.replace('remote_', '')).then(setModels);
      } else {
        fetchLocalModels(selectedProvider.replace('local_', '')).then(setModels);
      }
      setLoadingModels(false);
    }
  }, [selectedProvider]);

  const handleConfigChange = (key: keyof ModelConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
    onConfigChange({ ...config, [key]: value });
  };

  const handleProviderChange = (event: any) => {
    const provider = event.target.value;
    setSelectedProvider(provider);
    handleConfigChange('provider', provider);
  };

  const handleModelChange = (event: any) => {
    handleConfigChange('model', event.target.value);
  };

  return (
    <Card sx={{ width: '100%', mb: 4 }}>
      <CardHeader title="Chat Configuration" />
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Provider Selection */}
          <FormControlLabel
            control={
              <Select
                value={selectedProvider}
                onChange={handleProviderChange}
                fullWidth
                disabled={loadingRemoteLLMs || loadingLocalLLMs}
              >
                {loadingRemoteLLMs && (
                  <MenuItem value="">
                    <CircularProgress size={20} />
                  </MenuItem>
                )}
                {remoteLLMs?.map((llm: any) => (
                  <MenuItem key={llm.alias} value={`remote_${llm.alias}`}>{llm.provider} ({llm.alias})</MenuItem>
                ))}
                {localLLMs?.map((llm: any) => (
                  <MenuItem key={llm.alias} value={`local_${llm.alias}`}>{llm.name} ({llm.alias})</MenuItem>
                ))}
              </Select>
            }
            label="LLM Provider"
          />

          {/* Model Selection */}
          <FormControlLabel
            control={
              <Select
                value={config.model}
                onChange={handleModelChange}
                fullWidth
                disabled={loadingModels || !selectedProvider}
              >
                {loadingModels && (
                  <MenuItem value="">
                    <CircularProgress size={20} />
                  </MenuItem>
                )}
                {models.map((model: any) => (
                  <MenuItem key={model} value={model}>{model}</MenuItem>
                ))}
              </Select>
            }
            label="Model"
          />

          {/* System Prompt Editor */}
          <TextField
            label="System Prompt"
            multiline
            rows={3}
            value={config.systemPrompt}
            onChange={(e) => handleConfigChange('systemPrompt', e.target.value)}
            fullWidth
            variant="outlined"
          />

          {/* Parameter Sliders */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">Temperature</Typography>
              <Slider
                value={config.temperature}
                onChange={(_, value) => handleConfigChange('temperature', value as number)}
                min={0}
                max={2}
                step={0.1}
                marks
              />
              <Typography variant="body2">{config.temperature}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">Max Tokens</Typography>
              <Slider
                value={config.maxTokens}
                onChange={(_, value) => handleConfigChange('maxTokens', value as number)}
                min={100}
                max={4000}
                step={100}
                marks
              />
              <Typography variant="body2">{config.maxTokens}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">Top P</Typography>
              <Slider
                value={config.topP}
                onChange={(_, value) => handleConfigChange('topP', value as number)}
                min={0}
                max={1}
                step={0.05}
                marks
              />
              <Typography variant="body2">{config.topP}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">Frequency Penalty</Typography>
              <Slider
                value={config.frequencyPenalty}
                onChange={(_, value) => handleConfigChange('frequencyPenalty', value as number)}
                min={-2}
                max={2}
                step={0.1}
                marks
              />
              <Typography variant="body2">{config.frequencyPenalty}</Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body1">Presence Penalty</Typography>
              <Slider
                value={config.presencePenalty}
                onChange={(_, value) => handleConfigChange('presencePenalty', value as number)}
                min={-2}
                max={2}
                step={0.1}
                marks
              />
              <Typography variant="body2">{config.presencePenalty}</Typography>
            </Box>
          </Box>

          {/* Streaming Toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={config.streaming}
                onChange={(e) => handleConfigChange('streaming', e.target.checked)}
              />
            }
            label="Streaming"
          />

          {/* AI Agent Toggle (Disabled) */}
          <FormControlLabel
            control={
              <Switch
                disabled
                checked={false}
              />
            }
            label="AI Agent Integration (Coming Soon)"
          />
        </Box>
      </CardContent>
    </Card>
  );
};