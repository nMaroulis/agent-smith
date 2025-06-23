import React, { useState, useEffect } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Box, ListItemButton } from '@mui/material';
import { Delete as DeleteIcon, Save as SaveIcon, FolderOpen as FolderOpenIcon } from '@mui/icons-material';
import { getFlows, createFlow, updateFlow, deleteFlow, type Flow } from '../services/flows';

interface SaveLoadFlowProps {
  serializedGraph: any;
  onLoad: (graph: any) => void;
}

const SaveLoadFlow: React.FC<SaveLoadFlowProps> = ({ serializedGraph, onLoad }) => {
  const [open, setOpen] = useState(false);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [mode, setMode] = useState<'save' | 'load'>('save');
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadFlows();
    }
  }, [open]);

  const loadFlows = async () => {
    try {
      setIsLoading(true);
      const fetchedFlows = await getFlows();
      setFlows(fetchedFlows);
    } catch (error) {
      console.error('Failed to load flows:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSave = () => {
    setFlowName('');
    setFlowDescription('');
    setMode('save');
    setOpen(true);
  };

  const handleOpenLoad = () => {
    setMode('load');
    setSelectedFlow(null);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFlow(null);
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      alert('Please enter a flow name');
      return;
    }

    try {
      setIsLoading(true);
      const flowData = {
        name: flowName.trim(),
        description: flowDescription.trim() || undefined,
        serialized_graph: serializedGraph,
      };

      if (selectedFlow) {
        // Update existing flow
        await updateFlow(selectedFlow.id, flowData);
      } else {
        // Create new flow
        await createFlow(flowData);
      }
      
      await loadFlows();
      handleClose();
    } catch (error) {
      console.error('Failed to save flow:', error);
      alert('Failed to save flow. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoad = () => {
    if (selectedFlow) {
      onLoad(selectedFlow.serialized_graph);
      handleClose();
    }
  };

  const handleDelete = async (e: React.MouseEvent, flow: Flow) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete "${flow.name}"?`)) {
      try {
        setIsLoading(true);
        await deleteFlow(flow.id);
        await loadFlows();
      } catch (error) {
        console.error('Failed to delete flow:', error);
        alert('Failed to delete flow. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSelectFlow = (flow: Flow) => {
    if (mode === 'load') {
      setSelectedFlow(flow);
    } else {
      // In save mode, select flow to update
      setSelectedFlow(flow);
      setFlowName(flow.name);
      setFlowDescription(flow.description || '');
    }
  };

  const dialogTitle = mode === 'save' ? 'Save Flow' : 'Load Flow';
  const dialogActionText = mode === 'save' ? 'Save' : 'Load';
  const isActionDisabled = mode === 'save' ? !flowName.trim() : !selectedFlow;

  return (
    <>
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<SaveIcon />}
          onClick={handleOpenSave}
          disabled={!serializedGraph}
        >
          Save Flow
        </Button>
        <Button
          variant="outlined"
          startIcon={<FolderOpenIcon />}
          onClick={handleOpenLoad}
        >
          Load Flow
        </Button>
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {mode === 'save' && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Flow Name"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description (Optional)"
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
          )}

          <List>
            {isLoading ? (
              <ListItem>Loading flows...</ListItem>
            ) : flows.length === 0 ? (
              <ListItem>No flows found</ListItem>
            ) : (
              flows.map((flow) => (
                <ListItemButton
                  key={flow.id}
                  selected={selectedFlow?.id === flow.id}
                  onClick={() => handleSelectFlow(flow)}
                >
                  <ListItemText
                    primary={flow.name}
                    secondary={flow.description || 'No description'}
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleDelete(e, flow)}
                      disabled={isLoading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItemButton>
              ))
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={mode === 'save' ? handleSave : handleLoad}
            disabled={isActionDisabled || isLoading}
            variant="contained"
            color="primary"
          >
            {isLoading ? 'Processing...' : dialogActionText}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SaveLoadFlow;
