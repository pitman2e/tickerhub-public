FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build-env
WORKDIR /app

#Set timezone to HK
ENV TZ=Asia/Hong_Kong
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Copy csproj and restore as distinct layers
COPY backend/TickerHub.Api/*.csproj ./backend/TickerHub.Api/
COPY apphost/ServiceDefaults/*.csproj ./apphost/ServiceDefaults/
RUN dotnet restore ./backend/TickerHub.Api/StockHub.csproj

# Copy everything else and build
COPY apphost/ServiceDefaults/ ./apphost/ServiceDefaults/
COPY backend/TickerHub.Api/ ./backend/TickerHub.Api/

RUN dotnet publish ./backend/TickerHub.Api/StockHub.csproj -c Release -o /app/out

# Build runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build-env /app/out .
ENTRYPOINT ["dotnet", "StockHub.dll"]

#HEALTHCHECK --interval=300s --timeout=4s CMD curl --fail http://localhost/swagger/index.html || exit 1
