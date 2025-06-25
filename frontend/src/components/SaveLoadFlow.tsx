import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  TextField, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Box, 
  ListItemButton, 
  Typography,
  Snackbar,
  Alert,
  type AlertColor
} from '@mui/material';
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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: AlertColor;
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

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

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSave = async () => {
    if (!flowName.trim()) {
      alert('Please enter a flow name');
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a clean copy of the graph without the state
      const { state: graphState, ...graphWithoutState } = serializedGraph || {};
      
      // Convert array state to object format for the backend
      const flowState = Array.isArray(graphState) 
        ? { fields: graphState } 
        : { fields: [] };
      
      const flowData = {
        name: flowName.trim(),
        description: flowDescription.trim() || undefined,
        graph: graphWithoutState, // Graph without the state
        state: flowState, // State as an object with a fields array
      };

      console.log('Sending flow data to API:', JSON.stringify(flowData, null, 2));

      if (selectedFlow) {
        // Update existing flow
        console.log('Updating flow with ID:', selectedFlow.id);
        await updateFlow(selectedFlow.id, flowData);
        setSnackbar({
          open: true,
          message: 'Flow updated successfully!',
          severity: 'success',
        });
      } else {
        // Create new flow
        console.log('Creating new flow');
        await createFlow(flowData);
        setSnackbar({
          open: true,
          message: 'Flow created successfully!',
          severity: 'success',
        });
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
      // Convert the state back to array format for the frontend
      const stateArray = selectedFlow.state && selectedFlow.state.fields 
        ? selectedFlow.state.fields 
        : [];
      
      // Merge the graph and state when loading
      const graphWithState = {
        ...selectedFlow.graph,
        state: stateArray
      };
      
      onLoad(graphWithState);
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
          size="small"
          startIcon={<SaveIcon />}
          onClick={handleOpenSave}
          disabled={!serializedGraph}
          sx={{
            color: '#facc15',
            borderColor: 'rgba(250, 204, 21, 0.5)',
            background: 'transparent',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: '#fef3c7',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              backgroundImage: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), rgba(250, 204, 21, 0.1))',
              borderColor: 'rgba(250, 204, 21, 0.3)',
              boxShadow: '0 0 15px rgba(250, 204, 21, 0.2)',
              transform: 'translateY(-1px)'
            },
            '&.Mui-disabled': {
              color: 'rgba(250, 204, 21, 0.3)',
              borderColor: 'rgba(250, 204, 21, 0.1)',
              background: 'transparent',
              transform: 'none',
              boxShadow: 'none'
            }
          }}
        >
          Save Flow
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<FolderOpenIcon />}
          onClick={handleOpenLoad}
          sx={{
            color: '#fbbf24',
            borderColor: 'rgba(251, 191, 36, 0.5)',
            background: 'transparent',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              color: '#fef3c7',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              backgroundImage: 'linear-gradient(to right, rgba(234, 179, 8, 0.1), rgba(251, 191, 36, 0.1))',
              borderColor: 'rgba(251, 191, 36, 0.3)',
              boxShadow: '0 0 15px rgba(251, 191, 36, 0.2)',
              transform: 'translateY(-1px)'
            }
          }}
        >
          Load Flow
        </Button>
      </Box>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgb(17, 24, 39)', // Slightly lighter than bg-gray-900
            color: 'white',
            backgroundImage: 'none',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            '& .MuiDialogTitle-root': {
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              bgcolor: 'rgba(31, 41, 55, 0.5)', // bg-gray-800 with opacity
              px: 3,
              py: 2
            },
            '& .MuiDialogContent-root': {
              p: 3,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)'
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(251, 191, 36, 0.5)'
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'rgba(251, 191, 36, 0.8)'
                },
                '&.Mui-disabled fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.05)'
                },
                '& input, & textarea': {
                  color: 'white'
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)'
                },
                '&.Mui-focused .MuiInputLabel-root': {
                  color: 'rgba(251, 191, 36, 0.8)'
                }
              },
              '& .MuiInputLabel-root.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)'
              },
              '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: 'rgba(255, 255, 255, 0.3)'
              }
            },
            '& .MuiDialogActions-root': {
              px: 3,
              py: 2,
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              bgcolor: 'rgba(31, 41, 55, 0.5)' // bg-gray-800 with opacity
            }
          }
        }}
      >
        <DialogTitle sx={{ 
          color: 'white',
          fontWeight: 600,
          m: 0,
          fontSize: '1.25rem',
          lineHeight: '1.75rem'
        }}>
          {dialogTitle}
        </DialogTitle>
        <DialogContent>
          {mode === 'save' && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <TextField
                fullWidth
                label="Flow Name"
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                variant="outlined"
                size="small"
                margin="dense"
                disabled={isLoading}
                inputProps={{
                  style: {
                    color: 'white',
                  },
                }}
                InputLabelProps={{
                  style: { color: 'rgba(255, 255, 255, 0.7)' },
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(251, 191, 36, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(251, 191, 36, 0.8)'
                    },
                    '&.Mui-disabled fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&.Mui-focused .MuiInputLabel-root': {
                      color: 'rgba(251, 191, 36, 0.8)'
                    }
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              />
              <TextField
                fullWidth
                label="Description (Optional)"
                value={flowDescription}
                onChange={(e) => setFlowDescription(e.target.value)}
                variant="outlined"
                size="small"
                margin="dense"
                multiline
                rows={2}
                disabled={isLoading}
                inputProps={{
                  style: {
                    color: 'white',
                  },
                }}
                InputLabelProps={{
                  style: { color: 'rgba(255, 255, 255, 0.7)' },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)'
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(251, 191, 36, 0.5)'
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'rgba(251, 191, 36, 0.8)'
                    },
                    '&.Mui-disabled fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.05)'
                    },
                    '&.Mui-focused .MuiInputLabel-root': {
                      color: 'rgba(251, 191, 36, 0.8)'
                    }
                  },
                  '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(255, 255, 255, 0.3)'
                  }
                }}
              />
            </Box>
          )}
          <Box sx={{ mt: 2, mb: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Choose an existing flow to overwrite it
            </Typography>
          </Box>
          <List 
            sx={{ 
              maxHeight: 300, 
              overflow: 'auto',
              bgcolor: 'rgba(31, 41, 55, 0.3)',
              borderRadius: 1,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              mt: 1,
              '& .MuiListItemButton-root': {
                borderRadius: '0.375rem',
                mb: 0.5,
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)'
                },
                '&.Mui-selected': {
                  bgcolor: 'rgba(251, 191, 36, 0.1)',
                  borderLeft: '3px solid #fbbf24',
                  '&:hover': {
                    bgcolor: 'rgba(251, 191, 36, 0.15)'
                  },
                },
                '& .MuiListItemText-primary': {
                  color: 'white',
                  fontWeight: 500
                },
                '& .MuiListItemText-secondary': {
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.75rem',
                  lineHeight: '1rem'
                }
              }
            }}
          >
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
                      sx={{
                        color: '#f87171',
                        '&:hover': {
                          color: '#ef4444',
                          backgroundColor: 'rgba(239, 68, 68, 0.1)'
                        },
                        '&.Mui-disabled': {
                          color: 'rgba(239, 68, 68, 0.3)'
                        }
                      }}
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
          <Button 
            onClick={handleClose} 
            disabled={isLoading}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)'
              },
              '&.Mui-disabled': {
                color: 'rgba(255, 255, 255, 0.3)'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={mode === 'save' ? handleSave : handleLoad}
            disabled={isActionDisabled || isLoading}
            variant="contained"
            sx={{
              bgcolor: mode === 'save' ? 'rgba(234, 179, 8, 0.9)' : 'rgba(245, 158, 11, 0.9)',
              color: '#1f2937',
              fontWeight: 500,
              textTransform: 'none',
              px: 3,
              '&:hover': {
                bgcolor: mode === 'save' ? 'rgba(234, 179, 8, 1)' : 'rgba(245, 158, 11, 1)',
                boxShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
              },
              '&.Mui-disabled': {
                bgcolor: 'rgba(75, 85, 99, 0.5)',
                color: 'rgba(255, 255, 255, 0.3)',
                boxShadow: 'none'
              }
            }}
          >
            {isLoading ? 'Processing...' : dialogActionText}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SaveLoadFlow;
