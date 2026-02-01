import { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  Phone,
  User,
  ChevronRight,
  GripVertical,
  Clock,
  AlertCircle,
  Plus,
  Filter,
  MoreVertical,
  Eye,
  X,
} from 'lucide-react';
import { CRMService, DealPipeline, DealStage, SalesPipelineItem } from '../../services/CRMService';

interface SalesPipelineProps {
  onRefresh?: () => void;
}

export function SalesPipeline({ onRefresh }: SalesPipelineProps) {
  const [loading, setLoading] = useState(true);
  const [pipeline, setPipeline] = useState<DealPipeline | null>(null);
  const [items, setItems] = useState<SalesPipelineItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<SalesPipelineItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<SalesPipelineItem | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [defaultPipeline, pipelineItems] = await Promise.all([
        CRMService.getDefaultPipeline(),
        CRMService.getSalesPipeline(),
      ]);

      setPipeline(defaultPipeline);
      setItems(pipelineItems);
    } catch (err) {
      console.error('Failed to load pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: SalesPipelineItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetStage: DealStage) => {
    e.preventDefault();
    if (!draggedItem || draggedItem.deal_stage_id === targetStage.id) {
      setDraggedItem(null);
      return;
    }

    try {
      await CRMService.moveEstimateToStage(draggedItem.estimate_id, targetStage.id);

      // Update local state
      setItems(prev =>
        prev.map(item =>
          item.estimate_id === draggedItem.estimate_id
            ? {
                ...item,
                deal_stage_id: targetStage.id,
                stage_name: targetStage.name,
                probability: targetStage.probability,
                stage_order: targetStage.sort_order,
                days_in_stage: 0,
              }
            : item
        )
      );

      onRefresh?.();
    } catch (err) {
      console.error('Failed to move item:', err);
    } finally {
      setDraggedItem(null);
    }
  };

  const getItemsByStage = (stageId: string) => {
    return items.filter(item => item.deal_stage_id === stageId);
  };

  const getStageTotal = (stageId: string) => {
    return getItemsByStage(stageId).reduce((sum, item) => sum + (item.total_amount || 0), 0);
  };

  const getWeightedValue = (stageId: string, probability: number) => {
    return getStageTotal(stageId) * (probability / 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!pipeline || !pipeline.stages) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Pipeline Configured</h3>
        <p className="text-gray-500 mt-2">Contact an administrator to set up your sales pipeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{pipeline.name}</h2>
          <p className="text-sm text-gray-500">{pipeline.description}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Pipeline Value</p>
          <p className="text-xl font-bold text-gray-900 dark:text-white">
            ${items.reduce((sum, item) => sum + (item.total_amount || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {pipeline.stages.map((stage) => {
            const stageItems = getItemsByStage(stage.id);
            const stageTotal = getStageTotal(stage.id);
            const weightedValue = getWeightedValue(stage.id, stage.probability);

            return (
              <div
                key={stage.id}
                className="w-72 flex-shrink-0"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage)}
              >
                {/* Stage Header */}
                <div
                  className="rounded-t-lg px-3 py-2"
                  style={{ backgroundColor: stage.color + '20', borderTop: `3px solid ${stage.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{stage.name}</span>
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                        {stageItems.length}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">{stage.probability}%</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    ${stageTotal.toLocaleString()} | Weighted: ${weightedValue.toLocaleString()}
                  </div>
                </div>

                {/* Stage Content */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-b-lg p-2 min-h-[400px] space-y-2">
                  {stageItems.map((item) => (
                    <div
                      key={item.estimate_id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item)}
                      className={`bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-md transition-shadow ${
                        draggedItem?.estimate_id === item.estimate_id ? 'opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-500">{item.estimate_number}</span>
                        </div>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>

                      <h4 className="font-medium text-gray-900 dark:text-white mt-2 text-sm line-clamp-2">
                        {item.title || 'Untitled Estimate'}
                      </h4>

                      <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                        <User className="w-3 h-3" />
                        <span className="truncate">{item.customer_name}</span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-lg font-bold text-green-600">
                          ${item.total_amount?.toLocaleString()}
                        </span>
                        {item.days_in_stage > 7 && (
                          <span className="flex items-center gap-1 text-xs text-yellow-600">
                            <Clock className="w-3 h-3" />
                            {item.days_in_stage}d
                          </span>
                        )}
                      </div>

                      {item.expected_close_date && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          Close: {new Date(item.expected_close_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}

                  {stageItems.length === 0 && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deal Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={() => setSelectedItem(null)} />
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {selectedItem.estimate_number}
                </h3>
                <button onClick={() => setSelectedItem(null)} className="text-gray-400 hover:text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Title</label>
                  <p className="font-medium text-gray-900 dark:text-white">{selectedItem.title || 'Untitled'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Customer</label>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.customer_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Phone</label>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.customer_phone || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Amount</label>
                    <p className="text-xl font-bold text-green-600">${selectedItem.total_amount?.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Probability</label>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.probability}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Stage</label>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.stage_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Days in Stage</label>
                    <p className="font-medium text-gray-900 dark:text-white">{selectedItem.days_in_stage} days</p>
                  </div>
                </div>

                {selectedItem.expected_close_date && (
                  <div>
                    <label className="text-sm text-gray-500">Expected Close Date</label>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(selectedItem.expected_close_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setSelectedItem(null)} className="btn btn-outline">
                  Close
                </button>
                <button
                  onClick={() => {
                    // Navigate to estimate view
                    window.location.hash = `#estimates?id=${selectedItem.estimate_id}`;
                    setSelectedItem(null);
                  }}
                  className="btn btn-primary"
                >
                  View Estimate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
