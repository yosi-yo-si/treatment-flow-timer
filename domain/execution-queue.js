(function attachExecutionQueueDomain(global) {
  function sanitizeAllocatedMin(value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) {
      return 0;
    }
    return num;
  }

  function pickBaseAllocation(allocation) {
    if (!allocation || typeof allocation !== "object") {
      return [];
    }

    if (Array.isArray(allocation.units) && allocation.units.length > 0) {
      return allocation.units;
    }

    if (Array.isArray(allocation.blocks) && allocation.blocks.length > 0) {
      return allocation.blocks;
    }

    if (Array.isArray(allocation.frames) && allocation.frames.length > 0) {
      return allocation.frames;
    }

    return [];
  }

  function buildExecutionQueueFromPayload(payload) {
    const allocation = payload && payload.allocation;
    const base = pickBaseAllocation(allocation);

    return base
      .map((item, order) => ({
        name: item && item.name ? item.name : `枠${order + 1}`,
        sec: Math.floor(sanitizeAllocatedMin(item && item.allocatedMin) * 60),
        order,
      }))
      .filter((item) => item.sec > 0)
      .sort((a, b) => a.order - b.order);
  }

  global.TreatmentFlowDomain = global.TreatmentFlowDomain || {};
  global.TreatmentFlowDomain.executionQueue = {
    buildExecutionQueueFromPayload,
  };
})(window);
