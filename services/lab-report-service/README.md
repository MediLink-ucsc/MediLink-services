# Lab Report Service

## File Structure

```
lab-report-service
├── src
│   ├── app.js                  # Entry point of the Node.js application
│   ├── routes                  # Contains route definitions
│   │   ├── index.js           # Main routing configuration
│   │   └── extraction.js       # Routes related to extraction functionality
│   ├── controllers             # Contains controller logic
│   │   └── extractionController.js # Handles extraction requests
│   ├── services                # Contains service logic
│   │   └── pythonService.js    # Communicates with the Python extractor
│   ├── middleware              # Contains middleware functions
│   │   ├── auth.js             # Authentication middleware
│   │   └── upload.js           # File upload middleware
│   └── utils                   # Utility functions
│       └── helpers.js          # Common utility functions
├── python                      # Python scripts for extraction
│   ├── extractor.py            # Main extraction logic
│   ├── utils.py                # Utility functions for extraction
│   ├── parser_patient_details.py # Logic for parsing patient details
│   ├── parser_prescription.py   # Logic for parsing prescriptions
│   ├── parser_lab_report.py     # Logic for parsing lab reports
│   ├── parser_fbc_report.py     # Logic for parsing FBC reports
│   └── requirements.txt        # Python dependencies
├── uploads                     # Directory for uploaded files
│   └── .gitkeep                # Keeps uploads directory in version control
├── docker                      # Docker configuration
│   ├── Dockerfile              # Instructions for building the Docker image
│   └── docker-compose.yml      # Defines services and orchestration
├── package.json                # npm configuration file
├── .env                        # Environment variables
├── .gitignore                  # Files to ignore by Git
└── README.md                   # Project documentation
```

## Setup Instructions

1. **Clone the repository:**

   ```
   git clone
   cd lab-report-service
   ```

2. **Install Node.js dependencies:**

   ```
   npm install
   ```

3. **Set up Python environment:**

   - Navigate to the `python` directory.
   - Create a virtual environment (optional but recommended):
     ```
     python -m venv venv
     source venv/bin/activate  # On Windows use `venv\Scripts\activate`
     ```
   - Install Python dependencies:
     ```
     pip install -r requirements.txt
     ```

4. **Configure environment variables:**

   - Create a `.env` file in the root directory and set the necessary environment variables.

5. **Run the application:**
   ```
   npm start
   ```

## Docker

To run the application using Docker, use the following commands:

1. **Build the Docker image:**

   ```
   docker-compose build
   ```

2. **Run the Docker containers:**
   ```
   docker-compose up
   ```

This will start the Node.js backend and the Python extractor in separate containers.
