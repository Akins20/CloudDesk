{{/*
Expand the name of the chart.
*/}}
{{- define "clouddesk.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "clouddesk.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "clouddesk.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "clouddesk.labels" -}}
helm.sh/chart: {{ include "clouddesk.chart" . }}
{{ include "clouddesk.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "clouddesk.selectorLabels" -}}
app.kubernetes.io/name: {{ include "clouddesk.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Backend labels
*/}}
{{- define "clouddesk.backend.labels" -}}
{{ include "clouddesk.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{- define "clouddesk.backend.selectorLabels" -}}
{{ include "clouddesk.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "clouddesk.frontend.labels" -}}
{{ include "clouddesk.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{- define "clouddesk.frontend.selectorLabels" -}}
{{ include "clouddesk.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Session Controller labels
*/}}
{{- define "clouddesk.sessionController.labels" -}}
{{ include "clouddesk.labels" . }}
app.kubernetes.io/component: session-controller
{{- end }}

{{- define "clouddesk.sessionController.selectorLabels" -}}
{{ include "clouddesk.selectorLabels" . }}
app.kubernetes.io/component: session-controller
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "clouddesk.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "clouddesk.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
MongoDB connection string
*/}}
{{- define "clouddesk.mongodbUri" -}}
{{- if .Values.mongodb.enabled }}
{{- printf "mongodb://%s:%s@%s-mongodb:27017/%s?authSource=admin" .Values.mongodb.auth.username .Values.mongodb.auth.password (include "clouddesk.fullname" .) .Values.mongodb.auth.database }}
{{- else }}
{{- printf "mongodb://%s:%s@%s:%d/%s?authSource=admin" .Values.mongodb.external.username .Values.mongodb.external.password .Values.mongodb.external.host (int .Values.mongodb.external.port) .Values.mongodb.external.database }}
{{- end }}
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "clouddesk.redisUrl" -}}
{{- if .Values.redis.enabled }}
{{- if .Values.redis.auth.enabled }}
{{- printf "redis://:%s@%s-redis-master:6379" .Values.redis.auth.password (include "clouddesk.fullname" .) }}
{{- else }}
{{- printf "redis://%s-redis-master:6379" (include "clouddesk.fullname" .) }}
{{- end }}
{{- else }}
{{- if .Values.redis.external.password }}
{{- printf "redis://:%s@%s:%d" .Values.redis.external.password .Values.redis.external.host (int .Values.redis.external.port) }}
{{- else }}
{{- printf "redis://%s:%d" .Values.redis.external.host (int .Values.redis.external.port) }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Image pull secrets
*/}}
{{- define "clouddesk.imagePullSecrets" -}}
{{- with .Values.global.imagePullSecrets }}
imagePullSecrets:
  {{- toYaml . | nindent 2 }}
{{- end }}
{{- end }}
