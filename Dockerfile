FROM node:20-alpine
WORKDIR /documatic
COPY . .
RUN npm install
RUN npm run build-prod
ENV MODE=prod
ENV PORT=443
CMD ["npm", "run", "start-container"]
EXPOSE 443
