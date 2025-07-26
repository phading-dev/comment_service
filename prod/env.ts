import "../env_const";
import "@phading/cluster/prod/env";
import { ENV_VARS } from "../env_vars";

ENV_VARS.spannerInstanceId = ENV_VARS.balancedSpannerInstanceId;
ENV_VARS.replicas = 2;
ENV_VARS.cpu = "200m";
ENV_VARS.memory = "256Mi";
