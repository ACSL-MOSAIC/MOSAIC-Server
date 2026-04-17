import type { StoreType } from "@/mosaic/store/interface/mosaic-store.ts";

import { WidgetDescriptor } from "@/components/Dashboard/Widgets/WidgetDescriptor.ts";

export default class ClearpathPlatformPowerViewerWidgetDescriptor extends WidgetDescriptor {
  public getName(): string {
    return "ClearpathPlatformPowerViewerWidget";
  }

  public getRequiredStoreType(): StoreType {
    return "receivable";
  }

  public getDefaultInjectData(): string {
    return JSON.stringify({
      battery_connected: 1,
      charger_connected: 0,
      measured_currents: {
        left_driver_current: "2.15 A",
        mcu_and_user_port_current: "0.87 A",
        right_driver_current: "2.03 A",
      },
      measured_voltages: {
        battery_voltage: "25.6 V",
        left_driver_voltage: "24.9 V",
        right_driver_voltage: "25.1 V",
      },
      timestamp: 1716000000000000,
    });
  }
}
