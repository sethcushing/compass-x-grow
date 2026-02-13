import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DndContext, closestCenter, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Plus, 
  GripVertical, 
  AlertTriangle, 
  Calendar,
  Building2,
  DollarSign,
  User,
  MoreHorizontal,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Sortable Opportunity Card
const OpportunityCard = ({ opportunity, organizations, users, onToggleAtRisk }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.opp_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const org = organizations.find(o => o.org_id === opportunity.org_id);
  const owner = users?.find(u => u.user_id === opportunity.owner_id);
  
  const getActivityStatus = () => {
    if (opportunity.is_at_risk) return 'at-risk';
    return 'normal';
  };

  const status = getActivityStatus();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'dragging' : ''} ${
        status === 'at-risk' ? 'ring-2 ring-amber-300' : ''
      }`}
    >
      <div className="flex items-start gap-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 hover:bg-slate-100 rounded"
        >
          <GripVertical className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <Link to={`/opportunities/${opportunity.opp_id}`}>
            <h4 className="font-medium text-sm text-slate-900 hover:text-ocean-600 truncate">
              {opportunity.name}
            </h4>
          </Link>
          <div className="flex items-center gap-1 mt-1">
            <Building2 className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500 truncate">{org?.name || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <User className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500 truncate">{owner?.name || 'Unassigned'}</span>
          </div>
        </div>
        
        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {opportunity.is_at_risk ? (
              <DropdownMenuItem
                data-testid={`clear-at-risk-${opportunity.opp_id}`}
                onClick={() => onToggleAtRisk(opportunity, false)}
                className="text-emerald-600"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Clear At-Risk Status
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                data-testid={`mark-at-risk-${opportunity.opp_id}`}
                onClick={() => onToggleAtRisk(opportunity, true)}
                className="text-amber-600"
              >
                <ShieldAlert className="w-4 h-4 mr-2" />
                Mark as At-Risk
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <DollarSign className="w-3 h-3 text-emerald-600" />
          <span className="text-sm font-medium text-slate-900">
            {new Intl.NumberFormat('en-US', {
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(opportunity.estimated_value || 0)}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs bg-slate-100">
          {opportunity.confidence_level}%
        </Badge>
      </div>

      {opportunity.is_at_risk && (
        <div className="mt-2 flex items-center gap-1 text-amber-600">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs truncate" title={opportunity.at_risk_reason || 'At Risk'}>
            {opportunity.at_risk_reason || 'At Risk'}
          </span>
        </div>
      )}
      
      {opportunity.target_close_date && (
        <div className="mt-2 flex items-center gap-1 text-slate-500">
          <Calendar className="w-3 h-3" />
          <span className="text-xs">
            {new Date(opportunity.target_close_date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}
          </span>
        </div>
      )}
    </div>
  );
};

// Kanban Column
const KanbanColumn = ({ stage, opportunities, organizations, users, onToggleAtRisk }) => {
  const totalValue = opportunities.reduce((sum, o) => sum + (o.estimated_value || 0), 0);
  
  return (
    <div className="kanban-column">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-heading font-medium text-slate-900 text-sm">{stage.name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {opportunities.length} deals · ${(totalValue / 1000).toFixed(0)}K
          </p>
        </div>
        <Badge variant="secondary" className="bg-ocean-100 text-ocean-700">
          {stage.win_probability}%
        </Badge>
      </div>
      
      <SortableContext
        items={opportunities.map(o => o.opp_id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-2 min-h-[100px]">
          <AnimatePresence>
            {opportunities.map((opp, index) => (
              <motion.div
                key={opp.opp_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05 }}
              >
                <OpportunityCard
                  opportunity={opp}
                  organizations={organizations}
                  users={users}
                  onToggleAtRisk={onToggleAtRisk}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </div>
  );
};

const Pipeline = () => {
  const [stages, setStages] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' or 'mine'
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeId, setActiveId] = useState(null);
  
  // At-risk dialog state
  const [atRiskDialogOpen, setAtRiskDialogOpen] = useState(false);
  const [selectedOppForRisk, setSelectedOppForRisk] = useState(null);
  const [atRiskReason, setAtRiskReason] = useState('');
  
  const [newOpp, setNewOpp] = useState({
    name: '',
    org_id: '',
    engagement_type: 'Advisory',
    estimated_value: 0,
    confidence_level: 50,
    stage_id: '',
    source: 'Inbound',
    owner_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pipelinesRes, orgsRes, usersRes, meRes] = await Promise.all([
        fetch(`${API}/pipelines`, { credentials: 'include' }),
        fetch(`${API}/organizations`, { credentials: 'include' }),
        fetch(`${API}/auth/users`, { credentials: 'include' }),
        fetch(`${API}/auth/me`, { credentials: 'include' })
      ]);
      
      const pipelines = await pipelinesRes.json();
      const orgsData = await orgsRes.json();
      setOrganizations(orgsData);
      
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }
      
      if (meRes.ok) {
        const meData = await meRes.json();
        setCurrentUser(meData);
      }
      
      if (pipelines.length > 0) {
        const defaultPipeline = pipelines.find(p => p.is_default) || pipelines[0];
        
        const [stagesRes, oppsRes] = await Promise.all([
          fetch(`${API}/pipelines/${defaultPipeline.pipeline_id}/stages`, { credentials: 'include' }),
          fetch(`${API}/opportunities?pipeline_id=${defaultPipeline.pipeline_id}`, { credentials: 'include' })
        ]);
        
        const stagesData = await stagesRes.json();
        const oppsData = await oppsRes.json();
        
        setStages(stagesData);
        setOpportunities(oppsData);
        
        if (stagesData.length > 0) {
          setNewOpp(prev => ({ ...prev, stage_id: stagesData[0].stage_id, pipeline_id: defaultPipeline.pipeline_id }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  // Filter opportunities based on view mode
  const filteredOpportunities = viewMode === 'mine' && currentUser
    ? opportunities.filter(opp => opp.owner_id === currentUser.user_id)
    : opportunities;

  // Handle at-risk toggle
  const handleToggleAtRisk = (opportunity, markAsAtRisk) => {
    if (markAsAtRisk) {
      // Open dialog to get reason
      setSelectedOppForRisk(opportunity);
      setAtRiskReason('');
      setAtRiskDialogOpen(true);
    } else {
      // Clear at-risk status directly
      updateAtRiskStatus(opportunity.opp_id, false, null);
    }
  };

  const updateAtRiskStatus = async (oppId, isAtRisk, reason) => {
    try {
      const response = await fetch(`${API}/opportunities/${oppId}/at-risk`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_at_risk: isAtRisk, at_risk_reason: reason })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      const updated = await response.json();
      setOpportunities(prev => prev.map(o => o.opp_id === oppId ? updated : o));
      toast.success(isAtRisk ? 'Marked as at-risk' : 'At-risk status cleared');
    } catch (error) {
      console.error('Error updating at-risk status:', error);
      toast.error('Failed to update at-risk status');
    }
  };

  const handleConfirmAtRisk = () => {
    if (!selectedOppForRisk) return;
    if (!atRiskReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    updateAtRiskStatus(selectedOppForRisk.opp_id, true, atRiskReason.trim());
    setAtRiskDialogOpen(false);
    setSelectedOppForRisk(null);
    setAtRiskReason('');
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;
    
    // Find the opportunity being dragged
    const draggedOpp = opportunities.find(o => o.opp_id === active.id);
    if (!draggedOpp) return;
    
    // Find which stage the card was dropped in
    // The over.id could be another card or a droppable area
    let targetStageId = null;
    
    // Check if dropped on another opportunity
    const targetOpp = opportunities.find(o => o.opp_id === over.id);
    if (targetOpp) {
      targetStageId = targetOpp.stage_id;
    }
    
    // If no stage change, do nothing
    if (!targetStageId || targetStageId === draggedOpp.stage_id) return;
    
    try {
      const response = await fetch(`${API}/opportunities/${active.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stage_id: targetStageId })
      });
      
      if (!response.ok) throw new Error('Failed to update');
      
      // Update local state
      setOpportunities(prev => prev.map(o => 
        o.opp_id === active.id ? { ...o, stage_id: targetStageId } : o
      ));
      
      const stageName = stages.find(s => s.stage_id === targetStageId)?.name;
      toast.success(`Moved to ${stageName}`);
    } catch (error) {
      console.error('Error updating opportunity:', error);
      toast.error('Failed to move opportunity');
    }
  };

  const handleCreateOpp = async () => {
    if (!newOpp.name || !newOpp.org_id) {
      toast.error('Please fill in required fields');
      return;
    }
    if (!newOpp.owner_id) {
      toast.error('Please select an owner');
      return;
    }
    
    try {
      const response = await fetch(`${API}/opportunities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...newOpp,
          pipeline_id: stages[0]?.pipeline_id || 'pipe_default'
        })
      });
      
      if (!response.ok) throw new Error('Failed to create');
      
      const created = await response.json();
      setOpportunities(prev => [...prev, created]);
      setIsDialogOpen(false);
      setNewOpp({
        name: '',
        org_id: '',
        engagement_type: 'Advisory',
        estimated_value: 0,
        confidence_level: 50,
        stage_id: stages[0]?.stage_id || '',
        source: 'Inbound',
        owner_id: ''
      });
      toast.success('Opportunity created');
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast.error('Failed to create opportunity');
    }
  };

  const activeOpp = activeId ? opportunities.find(o => o.opp_id === activeId) : null;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-slate-200 rounded mb-6"></div>
            <div className="flex gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-80 h-96 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <h1 className="text-2xl font-heading font-semibold text-slate-900">Sales Pipeline</h1>
              <p className="text-sm text-slate-500">Drag deals between stages to update progress</p>
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center bg-slate-100 rounded-full p-1">
              <button
                data-testid="pipeline-view-all"
                onClick={() => setViewMode('all')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'all' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                All
              </button>
              <button
                data-testid="pipeline-view-mine"
                onClick={() => setViewMode('mine')}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  viewMode === 'mine' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                My
              </button>
            </div>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="create-opportunity-btn" className="bg-ocean-950 hover:bg-ocean-900 rounded-full">
                <Plus className="w-4 h-4 mr-2" /> New Opportunity
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Opportunity</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="opp-name">Opportunity Name *</Label>
                  <Input
                    id="opp-name"
                    data-testid="opp-name-input"
                    value={newOpp.name}
                    onChange={(e) => setNewOpp(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Acme Data Platform Modernization"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="opp-org">Organization *</Label>
                  <Select
                    value={newOpp.org_id}
                    onValueChange={(value) => setNewOpp(prev => ({ ...prev, org_id: value }))}
                  >
                    <SelectTrigger data-testid="opp-org-select" className="mt-1">
                      <SelectValue placeholder="Select organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map(org => (
                        <SelectItem key={org.org_id} value={org.org_id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="opp-owner">Owner *</Label>
                  <Select
                    value={newOpp.owner_id}
                    onValueChange={(value) => setNewOpp(prev => ({ ...prev, owner_id: value }))}
                  >
                    <SelectTrigger data-testid="opp-owner-select" className="mt-1">
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="opp-type">Engagement Type</Label>
                    <Select
                      value={newOpp.engagement_type}
                      onValueChange={(value) => setNewOpp(prev => ({ ...prev, engagement_type: value }))}
                    >
                      <SelectTrigger data-testid="opp-type-select" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Advisory">Advisory</SelectItem>
                        <SelectItem value="Strategy">Strategy</SelectItem>
                        <SelectItem value="AI Enablement">AI Enablement</SelectItem>
                        <SelectItem value="Data Modernization">Data Modernization</SelectItem>
                        <SelectItem value="Platform / Architecture">Platform / Architecture</SelectItem>
                        <SelectItem value="Transformation">Transformation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="opp-source">Source</Label>
                    <Select
                      value={newOpp.source}
                      onValueChange={(value) => setNewOpp(prev => ({ ...prev, source: value }))}
                    >
                      <SelectTrigger data-testid="opp-source-select" className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inbound">Inbound</SelectItem>
                        <SelectItem value="Referral">Referral</SelectItem>
                        <SelectItem value="Exec Intro">Exec Intro</SelectItem>
                        <SelectItem value="Expansion">Expansion</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="opp-value">Estimated Value ($)</Label>
                    <Input
                      id="opp-value"
                      data-testid="opp-value-input"
                      type="number"
                      value={newOpp.estimated_value}
                      onChange={(e) => setNewOpp(prev => ({ ...prev, estimated_value: parseFloat(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="opp-confidence">Confidence (%)</Label>
                    <Input
                      id="opp-confidence"
                      data-testid="opp-confidence-input"
                      type="number"
                      min="0"
                      max="100"
                      value={newOpp.confidence_level}
                      onChange={(e) => setNewOpp(prev => ({ ...prev, confidence_level: parseInt(e.target.value) || 0 }))}
                      className="mt-1"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="opp-stage">Initial Stage</Label>
                  <Select
                    value={newOpp.stage_id}
                    onValueChange={(value) => setNewOpp(prev => ({ ...prev, stage_id: value }))}
                  >
                    <SelectTrigger data-testid="opp-stage-select" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.filter(s => !s.name.includes('Closed')).map(stage => (
                        <SelectItem key={stage.stage_id} value={stage.stage_id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  data-testid="submit-opportunity-btn"
                  onClick={handleCreateOpp}
                  className="w-full bg-ocean-950 hover:bg-ocean-900 rounded-full"
                >
                  Create Opportunity
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban Board */}
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="kanban-board overflow-x-auto">
            {stages.map((stage) => {
              const stageOpps = filteredOpportunities.filter(o => o.stage_id === stage.stage_id);
              return (
                <KanbanColumn
                  key={stage.stage_id}
                  stage={stage}
                  opportunities={stageOpps}
                  organizations={organizations}
                  users={users}
                  onToggleAtRisk={handleToggleAtRisk}
                />
              );
            })}
          </div>
          
          <DragOverlay>
            {activeOpp && (
              <div className="kanban-card shadow-lg rotate-3">
                <h4 className="font-medium text-sm text-slate-900">{activeOpp.name}</h4>
              </div>
            )}
          </DragOverlay>
        </DndContext>
        
        {/* At-Risk Dialog */}
        <Dialog open={atRiskDialogOpen} onOpenChange={setAtRiskDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Mark as At-Risk
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>{selectedOppForRisk?.name}</strong>
                </p>
              </div>
              <div>
                <Label htmlFor="at-risk-reason">Reason for At-Risk Status *</Label>
                <Textarea
                  id="at-risk-reason"
                  data-testid="at-risk-reason-input"
                  value={atRiskReason}
                  onChange={(e) => setAtRiskReason(e.target.value)}
                  placeholder="e.g., Budget concerns, Decision maker left, Competitor threat..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setAtRiskDialogOpen(false)}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                data-testid="confirm-at-risk-btn"
                onClick={handleConfirmAtRisk}
                className="bg-amber-500 hover:bg-amber-600 text-white rounded-full"
              >
                Mark as At-Risk
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default Pipeline;
