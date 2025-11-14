"""
SYNCADS OMNIBRAIN - METRICS
Sistema de Métricas e Observability

Autor: SyncAds AI Team
Versão: 1.0.0
"""

import logging
import time
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List

logger = logging.getLogger("omnibrain.metrics")


@dataclass
class MetricData:
    """Dados de uma métrica"""
    name: str
    value: float
    timestamp: datetime = field(default_factory=datetime.now)
    labels: Dict[str, str] = field(default_factory=dict)


class MetricsCollector:
    """Coletor de métricas"""

    def __init__(self):
        self.counters = defaultdict(int)
        self.gauges = defaultdict(float)
        self.histograms = defaultdict(list)
        self.start_time = time.time()
        logger.info("MetricsCollector initialized")

    def increment_counter(self, name: str, value: int = 1, labels: Dict[str, str] = None):
        """Incrementa contador"""
        key = self._make_key(name, labels)
        self.counters[key] += value

    def set_gauge(self, name: str, value: float, labels: Dict[str, str] = None):
        """Define gauge"""
        key = self._make_key(name, labels)
        self.gauges[key] = value

    def observe_histogram(self, name: str, value: float, labels: Dict[str, str] = None):
        """Adiciona observação ao histograma"""
        key = self._make_key(name, labels)
        self.histograms[key].append(value)

    def get_metrics(self) -> Dict[str, Any]:
        """Retorna todas as métricas"""
        return {
            "counters": dict(self.counters),
            "gauges": dict(self.gauges),
            "histograms": {
                k: {
                    "count": len(v),
                    "sum": sum(v),
                    "avg": sum(v) / len(v) if v else 0,
                    "min": min(v) if v else 0,
                    "max": max(v) if v else 0
                }
                for k, v in self.histograms.items()
            },
            "uptime_seconds": time.time() - self.start_time
        }

    def _make_key(self, name: str, labels: Dict[str, str] = None) -> str:
        """Cria chave com labels"""
        if not labels:
            return name
        label_str = ",".join(f"{k}={v}" for k, v in sorted(labels.items()))
        return f"{name}{{{label_str}}}"


# Singleton
_collector = MetricsCollector()

def get_metrics_collector() -> MetricsCollector:
    return _collector


# Convenience functions
def increment(name: str, value: int = 1, **labels):
    _collector.increment_counter(name, value, labels)

def gauge(name: str, value: float, **labels):
    _collector.set_gauge(name, value, labels)

def histogram(name: str, value: float, **labels):
    _collector.observe_histogram(name, value, labels)

def get_metrics() -> Dict[str, Any]:
    return _collector.get_metrics()


# Standard metrics
TASK_EXECUTIONS = "omnibrain_task_executions_total"
TASK_DURATION = "omnibrain_task_duration_seconds"
TASK_ERRORS = "omnibrain_task_errors_total"
LIBRARY_SELECTIONS = "omnibrain_library_selections_total"
CACHE_HITS = "omnibrain_cache_hits_total"
CACHE_MISSES = "omnibrain_cache_misses_total"
