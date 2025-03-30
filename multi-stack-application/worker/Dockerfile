# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY Worker.csproj .
RUN dotnet restore

# Copy the rest of the source code and build
COPY . .
RUN dotnet publish -c Release -o /app/publish

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/runtime:8.0 AS runtime
WORKDIR /app

# Copy the published output from the build stage
COPY --from=build /app/publish ./

# Set environment variables (can be overridden at runtime)
ENV DB_HOST=db
ENV DB_USERNAME=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=postgres
ENV REDIS_HOST=redis

# Define the entry point
ENTRYPOINT ["dotnet", "Worker.dll"]
